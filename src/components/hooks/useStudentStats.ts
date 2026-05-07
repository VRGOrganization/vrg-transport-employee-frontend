"use client";

import { useState, useEffect } from "react";
import { StudentDashboardStats } from "@/types/student-stats";
import { employeeApi } from "@/lib/employeeApi";
import {
  LicenseRecord,
  LicenseRequestRecord,
  StudentRecord,
  StudentsResponse,
} from "@/types/cards.types";

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

export function useStudentStats(): UseStudentStatsResult {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Buscamos os dados do dashboard (para gráficos de transporte) e dados brutos em paralelo
        const [dashboardData, studentsRes, licensesRes, requestsRes] = await Promise.all([
          employeeApi.get<StudentDashboardStats>("/student/stats/dashboard"),
          employeeApi.get<StudentsResponse>("/student"),
          employeeApi.get<LicenseRecord[]>("/license/all"),
          employeeApi.get<LicenseRequestRecord[]>("/license-request/all"),
        ]);

        if (cancelled) return;

        // Normalização dos dados brutos
        const allStudents = normalizeArrayResponse<StudentRecord>(studentsRes);
        const allLicenses = normalizeArrayResponse<LicenseRecord>(licensesRes);
        const rawRequests = normalizeArrayResponse<LicenseRequestRecord>(requestsRes);

        // Normaliza as solicitações para garantir que studentId seja uma string (resolve ObjectId se necessário)
        const allRequests = rawRequests.map((r) => ({
          ...r,
          studentId: resolveId(r.studentId) ?? r.studentId,
        }));

        // Filtros de negócio (seguindo a lógica do useCardsData)
        const activeStudents = allStudents.filter((s) => s.active);
        const licensedStudentIds = new Set(allLicenses.map((l) => resolveId(l.studentId) ?? l.studentId));
        const licensedActiveStudents = activeStudents.filter((s) => licensedStudentIds.has(s._id));
        
        // IDs de alunos que possuem QUALQUER solicitação (pendente, aprovada, rejeitada ou fila)
        const studentIdsWithAnyRequest = new Set(allRequests.map((r) => r.studentId));
        
        // IDs de alunos com solicitação especificamente PENDENTE
        const pendingStudentIds = new Set(
          allRequests
            .filter((r) => r.status === "pending")
            .map((r) => r.studentId)
        );

        // Recálculo das métricas básicas
        const totalActive = activeStudents.length;
        const withCard = licensedActiveStudents.length;
        const pending = activeStudents.filter((s) => pendingStudentIds.has(s._id)).length;
        
        // "Sem solicitação" = Ativos que não tem carteirinha E não tem nenhuma solicitação registrada
        const withoutAnything = activeStudents.filter(
          (s) => !licensedStudentIds.has(s._id) && !studentIdsWithAnyRequest.has(s._id)
        ).length;

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
        });

        // Mesclamos os dados recalculados
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
          },
          generatedAt: new Date().toISOString(),
        };

        setStats(finalStats);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar estatísticas");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    stats,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}