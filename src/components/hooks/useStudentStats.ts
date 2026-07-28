"use client";

import { useState, useEffect } from "react";
import { StudentDashboardStats } from "@/types/student-stats";
import { http } from "@/services/http";
import {
  LicenseRecord,
  LicenseRequestRecord,
  StudentRecord,
  StudentsResponse,
} from "@/types/cards.types";

type StudentStatsFilters = {
  busId?: string;
  universityId?: string;
  shift?: string;
};

type UseStudentStatsResult = {
  stats: StudentDashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

function normalizeArrayResponse<T>(
  response: T[] | { data?: T[] } | null | undefined,
): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray((response as { data?: T[] } | null | undefined)?.data)) {
    return (response as { data?: T[] }).data ?? [];
  }
  return [];
}

function resolveId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const nested = (value as { _id?: unknown })._id;
    return typeof nested === "string" ? nested : null;
  }
  return null;
}

function collectBusIds(reqs: LicenseRequestRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const r of reqs) {
    const direct = resolveId(r.busId);
    if (direct) ids.add(direct);
    r.allocationSummary?.forEach((a) => {
      if (a.busId) ids.add(a.busId);
    });
    r.accessBusIdentifiers?.forEach((id) => ids.add(id));
  }
  return ids;
}

function collectUniversityIds(reqs: LicenseRequestRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const r of reqs) {
    const id = resolveId(r.universityId);
    if (id) ids.add(id);
  }
  return ids;
}

function toSortedBreakdown(counts: Map<string, number>): { id: string; count: number }[] {
  return Array.from(counts.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

export function useStudentStats(filters?: StudentStatsFilters): UseStudentStatsResult {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const busId = filters?.busId;
  const universityId = filters?.universityId;
  const shift = filters?.shift;

  useEffect(() => {
    const mountState = { cancelled: false };

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Buscamos os dados do dashboard (para gráficos de transporte) e dados brutos em paralelo
        const [dashboardData, studentsRes, licensesRes, requestsRes] = await Promise.all([
          http.get<StudentDashboardStats>("/student/stats/dashboard"),
          http.get<StudentsResponse>("/student/all"),
          http.get<LicenseRecord[]>("/license/all"),
          http.get<LicenseRequestRecord[]>("/license-request"),
        ]);

        if (mountState.cancelled) return;

        // Normalização dos dados brutos
        const allStudents = normalizeArrayResponse<StudentRecord>(studentsRes);
        const allLicenses = normalizeArrayResponse<LicenseRecord>(licensesRes);
        const rawRequests = normalizeArrayResponse<LicenseRequestRecord>(requestsRes);

        // Normaliza as solicitações para garantir que studentId seja uma string (resolve ObjectId se necessário)
        const allRequests = rawRequests.map((r) => ({
          ...r,
          studentId: resolveId(r.studentId) ?? r.studentId,
        }));

        // Filtros de negócio base
        let activeStudents = allStudents.filter((s) => s.active);

        // Aplicação de Filtros (Ônibus, Faculdade, Turno)
        if (shift) {
          activeStudents = activeStudents.filter((s) => s.shift === shift);
        }
        if (busId || universityId) {
          activeStudents = activeStudents.filter((s) => {
            const studentReqs = allRequests.filter((r) => r.studentId === s._id);

            if (busId) {
              const matchesBus = studentReqs.some((r) => {
                return (
                  r.busId === busId ||
                  resolveId(r.busId) === busId ||
                  (r.allocationSummary && r.allocationSummary.some((a) => a.busId === busId)) ||
                  (r.accessBusIdentifiers && r.accessBusIdentifiers.includes(busId))
                );
              });
              if (!matchesBus) return false;
            }

            if (universityId) {
              const matchesUniv = studentReqs.some((r) => {
                return r.universityId === universityId || resolveId(r.universityId) === universityId;
              });
              if (!matchesUniv) return false;
            }

            return true;
          });
        }

        const licensedStudentIds = new Set(allLicenses.map((l) => resolveId(l.studentId) ?? l.studentId));
        const licensedActiveStudents = activeStudents.filter((s) => licensedStudentIds.has(s._id));
        
        // IDs de alunos com solicitação especificamente PENDENTE
        const pendingStudentIds = new Set(
          allRequests
            .filter((r) => r.status === "pending")
            .map((r) => r.studentId)
        );

        // Recálculo das métricas básicas
        const totalActive = activeStudents.length;
        
        // Carteirinha emitida = Ativos que tem carteirinha (mesmo que tenham solicitação de atualização)
        const withCard = licensedActiveStudents.length;
        
        // Solicitação pendente = Ativos que NÃO tem carteirinha MAS tem solicitação pendente
        const pending = activeStudents.filter(
          (s) => !licensedStudentIds.has(s._id) && pendingStudentIds.has(s._id)
        ).length;
        
        // Sem solicitação = O restante (Ativos que não tem carteirinha E não tem solicitação pendente)
        const withoutAnything = totalActive - withCard - pending;

        // --- Recálculo de Transporte (Baseado em quem tem carteirinha) ---
        const totalUsingTransport = licensedActiveStudents.length;

        const byShift = {
          morning: 0,
          afternoon: 0,
          night: 0,
          fullTime: 0,
        };

        const byDay = {
          SEG: 0,
          TER: 0,
          QUA: 0,
          QUI: 0,
          SEX: 0,
        };

        const busCounts = new Map<string, number>();
        const universityCounts = new Map<string, number>();

        licensedActiveStudents.forEach((student) => {
          // Turno
          if (student.shift === "Manhã") byShift.morning++;
          else if (student.shift === "Tarde") byShift.afternoon++;
          else if (student.shift === "Noite") byShift.night++;
          else if (student.shift === "Integral") byShift.fullTime++;

          // Grade Horária (Dias da semana)
          if (student.schedule && Array.isArray(student.schedule)) {
            const uniqueDays = new Set(student.schedule.map((item) => item.day));
            uniqueDays.forEach((day) => {
              if (day in byDay) {
                byDay[day as keyof typeof byDay]++;
              }
            });
          }

          // Quebra por ônibus / faculdade — de quais o aluno participa via
          // suas solicitações de carteirinha.
          const studentReqs = allRequests.filter((r) => r.studentId === student._id);
          collectBusIds(studentReqs).forEach((id) => {
            busCounts.set(id, (busCounts.get(id) ?? 0) + 1);
          });
          collectUniversityIds(studentReqs).forEach((id) => {
            universityCounts.set(id, (universityCounts.get(id) ?? 0) + 1);
          });
        });

        // Mesclamos os dados recalculados. generatedAt vem do próprio
        // dashboardData (timestamp real do servidor) — não sobrescrever com
        // a hora local do client, que mentiria sobre o frescor do dado.
        const finalStats: StudentDashboardStats = {
          ...dashboardData,
          totalStudents: totalActive,
          studentsWithCard: withCard,
          studentsWithPendingRequest: pending,
          studentsWithoutCard: withoutAnything,
          transport: {
            totalUsing: totalUsingTransport,
            byShift,
            byDay,
            byBus: toSortedBreakdown(busCounts),
            byUniversity: toSortedBreakdown(universityCounts),
          },
        };

        setStats(finalStats);
      } catch (err) {
        if (!mountState.cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar estatísticas");
        }
      } finally {
        if (!mountState.cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mountState.cancelled = true;
    };
  }, [tick, busId, universityId, shift]);

  return {
    stats,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}