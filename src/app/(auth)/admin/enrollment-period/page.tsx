"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EnrollmentPeriodModal } from "@/components/admin/EnrollmentPeriodModal";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";
import type {
  LicenseRequestRecord,
  StudentRecord,
  StudentsResponse,
} from "@/types/cards.types";
import type { EnrollmentPeriod, WaitlistEntry } from "@/types/enrollmentPeriod";

interface EnrollmentPeriodPayload {
  startDate: string;
  endDate: string;
  totalSlots: number;
  licenseValidityMonths: number;
}

function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(dateValue: string | null | undefined): string {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function normalizeStudents(response: StudentsResponse): StudentRecord[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function toProgressValue(period: EnrollmentPeriod): number {
  if (period.totalSlots <= 0) return 0;
  const raw = (period.filledSlots / period.totalSlots) * 100;
  return Math.max(0, Math.min(100, raw));
}

function buildFallbackStudent(studentId: string): StudentRecord {
  return {
    _id: studentId,
    name: "Aluno não encontrado",
    email: "-",
    active: true,
  };
}

export default function AdminEnrollmentPeriodPage() {
  const { user, logout } = useEmployeeAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [periods, setPeriods] = useState<EnrollmentPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<EnrollmentPeriod | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [waitlistRequests, setWaitlistRequests] = useState<LicenseRequestRecord[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<EnrollmentPeriod | null>(null);
  const [periodSaving, setPeriodSaving] = useState(false);
  const [periodModalError, setPeriodModalError] = useState("");

  // Nota: o fluxo de liberação por período foi removido. As liberações
  // agora ocorrem por ônibus (patch /bus/:id/release-slots). Mantemos a
  // exibição da fila, mas removemos o preview/confirm legados.

  const studentMap = useMemo(
    () => new Map(students.map((student) => [student._id, student])),
    [students],
  );

  const mapRequestToWaitlistEntry = useCallback(
    (request: LicenseRequestRecord): WaitlistEntry => ({
      request,
      student: studentMap.get(request.studentId) ?? buildFallbackStudent(request.studentId),
      filaPosition: request.filaPosition ?? Number.MAX_SAFE_INTEGER,
    }),
    [studentMap],
  );

  const latestClosedPeriod = useMemo(() => {
    return periods.find((period) => !period.active) ?? null;
  }, [periods]);

  const waitlistEntries = useMemo(() => {
    return waitlistRequests
      .map(mapRequestToWaitlistEntry)
      .sort((a, b) => {
        if (a.filaPosition === b.filaPosition) {
          return (
            new Date(a.request.createdAt).getTime() -
            new Date(b.request.createdAt).getTime()
          );
        }
        return a.filaPosition - b.filaPosition;
      });
  }, [waitlistRequests, mapRequestToWaitlistEntry]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let resolvedActive: EnrollmentPeriod | null = null;
      try {
        resolvedActive = await employeeApi.get<EnrollmentPeriod>("/enrollment-period/active");
      } catch (err: unknown) {
        const apiError = err as { status?: number };
        if (apiError.status !== 404) {
          throw err;
        }
      }

      const [periodsResponse, studentsResponse] = await Promise.all([
        employeeApi.get<EnrollmentPeriod[]>("/enrollment-period"),
        employeeApi.get<StudentsResponse>("/student"),
      ]);

      const sortedPeriods = [...periodsResponse].sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );

      setPeriods(sortedPeriods);
      setActivePeriod(resolvedActive);
      setStudents(normalizeStudents(studentsResponse));

      if (resolvedActive?._id) {
        const queue = await employeeApi.get<LicenseRequestRecord[]>(
          `/enrollment-period/${resolvedActive._id}/waitlist`,
        );
        setWaitlistRequests(queue);
      } else {
        setWaitlistRequests([]);
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? "Não foi possível carregar os dados do período de inscrição.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingPeriod(null);
    setPeriodModalError("");
    setModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (!activePeriod) return;
    setEditingPeriod(activePeriod);
    setPeriodModalError("");
    setModalOpen(true);
  };

  const handleSavePeriod = async (payload: EnrollmentPeriodPayload) => {
    setPeriodSaving(true);
    setPeriodModalError("");
    try {
      if (editingPeriod) {
        await employeeApi.patch<EnrollmentPeriod>(`/enrollment-period/${editingPeriod._id}`, payload);
        setFeedback("Período atualizado com sucesso.");
      } else {
        await employeeApi.post<EnrollmentPeriod>("/enrollment-period", payload);
        setFeedback("Novo período aberto com sucesso.");
      }
      setModalOpen(false);
      setEditingPeriod(null);
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setPeriodModalError(apiError.message ?? "Não foi possível salvar o período.");
    } finally {
      setPeriodSaving(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!activePeriod) return;
    const confirmed = window.confirm("Deseja encerrar o período ativo? A fila atual será encerrada.");
    if (!confirmed) return;

    try {
      await employeeApi.patch(`/enrollment-period/${activePeriod._id}/close`, {});
      setFeedback("Período encerrado com sucesso.");
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? "Falha ao encerrar o período.");
    }
  };

  const handleReopen = async (periodId: string) => {
    try {
      await employeeApi.patch(`/enrollment-period/${periodId}/reopen`, {});
      setFeedback("Período reaberto com sucesso.");
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? "Falha ao reabrir o período.");
    }
  };

  // Note: preview/confirm release flow removed. Use the Bus UI for releases.

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav activePath="/admin/enrollment-period" onLogout={logout} />

      <div className="flex flex-1 flex-col">
        <TopBar user={user} />

        <main className="px-6 py-5 bg-surface flex flex-col gap-5">
          <div className="mx-auto w-full  space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-on-surface">Período de Inscrição</h1>
                <p className="text-sm text-on-surface-variant">
                  Controle de vagas, fila de espera e histórico de períodos.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadData()}>
                Atualizar
              </Button>
            </header>

            {feedback && (
              <div className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
                {feedback}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-on-surface">Estado atual</h2>
                <div className="flex flex-wrap gap-2">
                  {activePeriod ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleOpenEdit}>
                        Editar
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleClosePeriod}>
                        Encerrar período
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                        Abrir novo período
                      </Button>
                      {latestClosedPeriod && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleReopen(latestClosedPeriod._id)}
                        >
                          Reabrir último período
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-on-surface-variant">Carregando período ativo...</p>
              ) : activePeriod ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Período</p>
                      <p className="font-medium text-on-surface">
                        {formatDate(activePeriod.startDate)} - {formatDate(activePeriod.endDate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Validade</p>
                      <p className="font-medium text-on-surface">
                        {activePeriod.licenseValidityMonths} meses
                      </p>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Status</p>
                      <p className="font-medium text-success">ABERTO</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Fila de espera</p>
                      <p className="font-medium text-on-surface">{waitlistEntries.length} aguardando</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-outline-variant bg-surface p-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">Vagas preenchidas</span>
                      <span className="font-medium text-on-surface">
                        {activePeriod.filledSlots} / {activePeriod.totalSlots}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${toProgressValue(activePeriod)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">Nenhum período aberto no momento.</p>
              )}
            </section>

            <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Histórico de períodos</h2>

              {periods.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Nenhum período cadastrado ainda.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-outline-variant">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-container-low text-on-surface-variant">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Abertura</th>
                        <th className="px-3 py-2 text-left font-medium">Encerramento</th>
                        <th className="px-3 py-2 text-left font-medium">Vagas</th>
                        <th className="px-3 py-2 text-left font-medium">Preenchidas</th>
                        <th className="px-3 py-2 text-left font-medium">Validade</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((period) => (
                        <tr key={period._id} className="border-t border-outline-variant/40">
                          <td className="px-3 py-2 text-on-surface">{formatDate(period.startDate)}</td>
                          <td className="px-3 py-2 text-on-surface-variant">
                            {formatDateTime(period.closedAt)}
                          </td>
                          <td className="px-3 py-2 text-on-surface-variant">{period.totalSlots}</td>
                          <td className="px-3 py-2 text-on-surface-variant">{period.filledSlots}</td>
                          <td className="px-3 py-2 text-on-surface-variant">
                            {period.licenseValidityMonths} meses
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                period.active
                                  ? "bg-success/15 text-success"
                                  : "bg-surface-container-high text-on-surface-variant"
                               }`}
                             >
                              {period.active ? "ABERTO" : "ENCERRADO"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {!period.active ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleReopen(period._id)}
                              >
                                Reabrir
                              </Button>
                            ) : (
                              <span className="text-xs text-on-surface-variant">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {activePeriod && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-on-surface">Fila de espera</h2>
                    <p className="text-sm text-on-surface-variant">
                      Libere vagas em lote para promover solicitações da fila para pendente.
                    </p>
                  </div>

                  <div className="text-sm text-on-surface-variant">
                    Liberação de vagas agora é feita por ônibus. Use a tela de Ônibus
                    para liberar vagas por ônibus e promover a fila.
                  </div>
                </div>

                {waitlistEntries.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    Não há alunos na fila de espera deste período.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-outline-variant">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container-low text-on-surface-variant">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Posição</th>
                          <th className="px-3 py-2 text-left font-medium">Nome</th>
                          <th className="px-3 py-2 text-left font-medium">E-mail</th>
                          <th className="px-3 py-2 text-left font-medium">Instituição</th>
                          <th className="px-3 py-2 text-left font-medium">Solicitação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitlistEntries.map((entry) => (
                          <tr key={entry.request._id} className="border-t border-outline-variant/40">
                            <td className="px-3 py-2 font-medium text-on-surface">
                              #{entry.filaPosition}
                            </td>
                            <td className="px-3 py-2 text-on-surface">{entry.student.name}</td>
                            <td className="px-3 py-2 text-on-surface-variant">{entry.student.email}</td>
                            <td className="px-3 py-2 text-on-surface-variant">
                              {entry.student.institution ?? "Não informada"}
                            </td>
                            <td className="px-3 py-2 text-on-surface-variant">
                              {formatDate(entry.request.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>

      <EnrollmentPeriodModal
        open={modalOpen}
        period={editingPeriod}
        loading={periodSaving}
        serverError={periodModalError}
        onClose={() => {
          if (periodSaving) return;
          setModalOpen(false);
          setEditingPeriod(null);
        }}
        onSubmit={handleSavePeriod}
      />

      {/* Preview/confirm period-level release removed (use Bus UI) */}
    </div>
  );
}


