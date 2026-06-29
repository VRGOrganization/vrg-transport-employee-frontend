"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { EnrollmentPeriodBanner } from "@/components/admin/EnrollmentPeriodBanner";
import { EnrollmentPeriodModal } from "@/components/admin/EnrollmentPeriodModal";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/lib/toast";
import { enrollmentPeriodService } from "@/services/enrollmentPeriodService";
import { PanelCard } from "@/components/ui/PanelCard";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { http } from "@/services/http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type {
  LicenseRequestRecord,
  StudentRecord,
  StudentsResponse,
} from "@/types/cards.types";
import type { EnrollmentPeriod, WaitlistEntry } from "@/types/enrollmentPeriod";

interface EnrollmentPeriodPayload {
  startDate: string;
  endDate: string;
  licenseValidityMonths: number;
}

function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function computeLicenseExpiry(endDate: string | null | undefined, months: number | null | undefined): string {
  if (!endDate || !months || months < 1) return "";
  try {
    const base = new Date(`${endDate.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(base.getTime())) return "";
    base.setMonth(base.getMonth() + months);
    return base.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
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
  const [loading, setLoading] = useState(true);

  const [periods, setPeriods] = useState<EnrollmentPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<EnrollmentPeriod | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [waitlistRequests, setWaitlistRequests] = useState<LicenseRequestRecord[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<EnrollmentPeriod | null>(null);
  const [periodSaving, setPeriodSaving] = useState(false);
  const [periodModalError, setPeriodModalError] = useState("");

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState(false);

  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [pendingReopenId, setPendingReopenId] = useState<string | null>(null);
  const [reopeningPeriod, setReopeningPeriod] = useState(false);

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
    try {
      const resolvedActive: EnrollmentPeriod | null = await enrollmentPeriodService.getActive().then(
        (res) => (res && typeof res === "object" && "_id" in res ? res : null),
        (err: unknown) => {
          const apiError = err as { status?: number };
          if (apiError.status !== 404) throw err;
          return null;
        },
      );

      const [periodsResponse, studentsResponse] = await Promise.all([
        enrollmentPeriodService.list(),
        http.get<StudentsResponse>("/student"),
      ]);

      const sortedPeriods = [...periodsResponse].sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );

      setPeriods(sortedPeriods);
      setActivePeriod(resolvedActive);
      setStudents(normalizeStudents(studentsResponse));

      if (resolvedActive?._id) {
        const queueRes = await http.get<Paginated<LicenseRequestRecord>>(
          `/enrollment-period/${resolvedActive._id}/waitlisted`,
        );
        setWaitlistRequests(resolvePaginated(queueRes));
      } else {
        setWaitlistRequests([]);
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      toast.error(apiError.message ?? "Não foi possível carregar os dados do período de inscrição.");
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
        await enrollmentPeriodService.update(editingPeriod._id, payload);
        toast.success("Período atualizado com sucesso.");
      } else {
        await enrollmentPeriodService.create(payload);
        toast.success("Novo período aberto com sucesso.");
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

  const handleClosePeriod = () => {
    if (!activePeriod) return;
    setShowCloseConfirm(true);
  };

  const handleCloseConfirmed = async () => {
    if (!activePeriod) return;
    setClosingPeriod(true);
    try {
      await enrollmentPeriodService.close(activePeriod._id);
      setShowCloseConfirm(false);
      toast.success("Período encerrado com sucesso.");
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      toast.error(apiError.message ?? "Falha ao encerrar o período.");
      setShowCloseConfirm(false);
    } finally {
      setClosingPeriod(false);
    }
  };

  const handleReopen = (periodId: string) => {
    setPendingReopenId(periodId);
    setShowReopenConfirm(true);
  };

  const handleReopenConfirmed = async () => {
    if (!pendingReopenId) return;
    setReopeningPeriod(true);
    try {
      await enrollmentPeriodService.reopen(pendingReopenId);
      setShowReopenConfirm(false);
      setPendingReopenId(null);
      toast.success("Período reaberto com sucesso.");
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      toast.error(apiError.message ?? "Falha ao reabrir o período.");
      setShowReopenConfirm(false);
    } finally {
      setReopeningPeriod(false);
    }
  };

  // Note: preview/confirm release flow removed. Use the Bus UI for releases.

  return (
    <>
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

            {activePeriod?.endDate && (
              <EnrollmentPeriodBanner endDate={activePeriod.endDate} />
            )}

            <PanelCard as="section" className="p-5">
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
                      <p className="text-xs text-on-surface-variant">Validade da carteirinha</p>
                      <p className="font-medium text-on-surface">
                        {activePeriod.licenseValidityMonths} meses
                      </p>
                      {computeLicenseExpiry(activePeriod.endDate, activePeriod.licenseValidityMonths) && (
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          até{" "}
                          <strong className="text-on-surface">
                            {computeLicenseExpiry(activePeriod.endDate, activePeriod.licenseValidityMonths)}
                          </strong>
                        </p>
                      )}
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
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        Ocupação (vaga-dia)
                        <InfoTooltip
                          ariaLabel="O que é vaga-dia?"
                          content="Vagas em vaga-dia: 1 vaga de ônibus equivale a 5 (segunda a sexta). O total é a soma das vagas dos ônibus ativos × 5."
                        />
                      </span>
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
            </PanelCard>

            <PanelCard as="section" className="p-5">
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
                        <th className="px-3 py-2 text-left font-medium">
                          <span className="flex items-center gap-1">
                            Total (vaga-dia)
                            <InfoTooltip
                              ariaLabel="O que é vaga-dia?"
                              content="Vagas em vaga-dia: 1 vaga de ônibus equivale a 5 (segunda a sexta). O total é a soma das vagas dos ônibus ativos × 5."
                            />
                          </span>
                        </th>
                        <th className="px-3 py-2 text-left font-medium">Ocupadas (vaga-dia)</th>
                        <th className="px-3 py-2 text-left font-medium">Validade</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((period) => (
                        <tr key={period._id} className="border-t border-outline-variant/40 hover:bg-surface-container-low/50 transition-colors">
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
            </PanelCard>

            {activePeriod && (
              <PanelCard as="section" className="p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-on-surface">Fila de espera</h2>
                    
                  </div>
                </div>

                {waitlistEntries.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
        
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
                          <tr key={entry.request._id} className="border-t border-outline-variant/40 hover:bg-surface-container-low/50 transition-colors">
                            <td className="px-3 py-2 font-medium text-on-surface">
                              #{entry.filaPosition}
                            </td>
                            <td className="px-3 py-2 text-on-surface capitalize">{entry.student.name}</td>
                            <td className="px-3 py-2 text-on-surface-variant">{entry.student.email}</td>
                            <td className="px-3 py-2 text-on-surface-variant capitalize">
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
              </PanelCard>
            )}
          </div>
        </main>

      <ConfirmModal
        open={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseConfirmed}
        loading={closingPeriod}
        title="Encerrar período"
        description="Deseja encerrar o período ativo? Alunos na fila de espera terão suas solicitações canceladas e as vagas dos ônibus serão resetadas."
        icon={AlertTriangle}
        variant="danger"
        confirmLabel="Encerrar"
        cancelLabel="Cancelar"
      />

      <ConfirmModal
        open={showReopenConfirm}
        onClose={() => { setShowReopenConfirm(false); setPendingReopenId(null); }}
        onConfirm={handleReopenConfirmed}
        loading={reopeningPeriod}
        title="Reabrir período"
        description="Deseja reabrir este período de inscrição? Ele voltará a aceitar novas solicitações de alunos."
        icon={RotateCcw}
        variant="warning"
        confirmLabel="Reabrir"
        cancelLabel="Cancelar"
      />

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
    </>
  );
}


