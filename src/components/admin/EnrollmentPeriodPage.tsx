"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { EnrollmentPeriodBanner } from "@/components/admin/EnrollmentPeriodBanner";
import { EnrollmentPeriodModal } from "@/components/admin/EnrollmentPeriodModal";
import {
  OpenPeriodModal,
  type OpenPeriodFormPayload,
} from "@/components/admin/OpenPeriodModal";
import { ScheduleResetModal } from "@/components/admin/ScheduleResetModal";
import {
  OpenEnrollmentWindowModal,
  type OpenEnrollmentWindowFormPayload,
} from "@/components/admin/OpenEnrollmentWindowModal";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ReinforcedConfirmModal } from "@/components/ui/ReinforcedConfirmModal";
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

function computeLicenseExpiry(cycleStartDate: string | null | undefined, months: number | null | undefined): string {
  if (!cycleStartDate || !months || months < 1) return "";
  const base = new Date(cycleStartDate);
  if (Number.isNaN(base.getTime())) return "";
  base.setMonth(base.getMonth() + months);
  return base.toLocaleDateString("pt-BR");
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

interface CycleStatusBadge {
  label: string;
  className: string;
  supportText?: string;
}

// Ciclo vivo pode estar com janela aberta ou não (ex.: janela original
// fechou, nenhuma nova janela aberta ainda) — as duas situações são bem
// diferentes e não devem compartilhar o mesmo selo "ABERTO".
function getActiveCycleStatus(period: EnrollmentPeriod): CycleStatusBadge {
  if (period.startDate && period.endDate) {
    return { label: "INSCRIÇÃO ABERTA", className: "text-success" };
  }
  return {
    label: "CICLO ATIVO — SEM INSCRIÇÃO ABERTA",
    className: "text-warning",
    supportText: "A equipe pode continuar processando a fila normalmente.",
  };
}

function buildFallbackStudent(studentId: string): StudentRecord {
  return {
    _id: studentId,
    name: "Aluno não encontrado",
    email: "-",
    active: true,
  };
}

export function EnrollmentPeriodPage({ role }: { role: "admin" | "employee" }) {
  void role;
  const [loading, setLoading] = useState(true);

  const [periods, setPeriods] = useState<EnrollmentPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<EnrollmentPeriod | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [waitlistRequests, setWaitlistRequests] = useState<LicenseRequestRecord[]>([]);

  const [showOpenPeriodModal, setShowOpenPeriodModal] = useState(false);
  const [openPeriodSaving, setOpenPeriodSaving] = useState(false);
  const [openPeriodError, setOpenPeriodError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [periodSaving, setPeriodSaving] = useState(false);
  const [periodModalError, setPeriodModalError] = useState("");

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState(false);

  const [showScheduleResetModal, setShowScheduleResetModal] = useState(false);
  const [pendingResetDays, setPendingResetDays] = useState<number | null>(null);
  const [showScheduleResetConfirm, setShowScheduleResetConfirm] = useState(false);
  const [scheduleResetConfirmSaving, setScheduleResetConfirmSaving] = useState(false);
  const [scheduleResetConfirmError, setScheduleResetConfirmError] = useState("");

  const [showWindowModal, setShowWindowModal] = useState(false);
  const [windowSaving, setWindowSaving] = useState(false);
  const [windowError, setWindowError] = useState("");

  const [showCloseWindowConfirm, setShowCloseWindowConfirm] = useState(false);
  const [closingWindow, setClosingWindow] = useState(false);

  // Nota: o fluxo de liberação por período foi removido. As liberações
  // agora ocorrem por ônibus (patch /bus/:id/release-slots). Mantemos a
  // exibição da fila, mas removemos o preview/confirm legados.

  const studentMap = useMemo(
    () => new Map(students.map((student) => [student._id, student])),
    [students],
  );

  const cycleStatus = useMemo(
    () => (activePeriod ? getActiveCycleStatus(activePeriod) : null),
    [activePeriod],
  );

  const mapRequestToWaitlistEntry = useCallback(
    (request: LicenseRequestRecord): WaitlistEntry => ({
      request,
      student: studentMap.get(request.studentId) ?? buildFallbackStudent(request.studentId),
      filaPosition: request.filaPosition ?? Number.MAX_SAFE_INTEGER,
    }),
    [studentMap],
  );

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
          new Date(b.cycleStartDate).getTime() - new Date(a.cycleStartDate).getTime(),
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

  const handleOpenCreatePeriod = () => {
    setOpenPeriodError("");
    setShowOpenPeriodModal(true);
  };

  const handleCreatePeriod = async (payload: OpenPeriodFormPayload) => {
    setOpenPeriodSaving(true);
    setOpenPeriodError("");
    try {
      await enrollmentPeriodService.create(payload);
      toast.success("Novo período aberto com sucesso.");
      setShowOpenPeriodModal(false);
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setOpenPeriodError(apiError.message ?? "Não foi possível abrir o período.");
    } finally {
      setOpenPeriodSaving(false);
    }
  };

  const handleOpenEdit = () => {
    if (!activePeriod) return;
    setPeriodModalError("");
    setShowEditModal(true);
  };

  const handleSavePeriod = async (payload: EnrollmentPeriodPayload) => {
    if (!activePeriod) return;
    setPeriodSaving(true);
    setPeriodModalError("");
    try {
      await enrollmentPeriodService.update(activePeriod._id, payload);
      toast.success("Período atualizado com sucesso.");
      setShowEditModal(false);
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

  // Note: preview/confirm release flow removed. Use the Bus UI for releases.

  const handleOpenScheduleReset = () => {
    setShowScheduleResetModal(true);
  };

  // Passo 1 (dias) só decide o prazo; a confirmação reforçada (passo 2) é
  // quem de fato dispara o agendamento, já que ao vencer o prazo a mesma
  // cascata de "Encerrar período" roda sozinha (cron).
  const handleScheduleResetSubmit = async (days: number) => {
    setPendingResetDays(days);
    setShowScheduleResetModal(false);
    setScheduleResetConfirmError("");
    setShowScheduleResetConfirm(true);
  };

  const handleScheduleResetConfirmed = async () => {
    if (!activePeriod || pendingResetDays == null) return;
    setScheduleResetConfirmSaving(true);
    setScheduleResetConfirmError("");
    try {
      const updated = await enrollmentPeriodService.scheduleReset(
        activePeriod._id,
        pendingResetDays,
      );
      setShowScheduleResetConfirm(false);
      setPendingResetDays(null);
      const formattedReset = formatDateTime(updated.resetScheduledFor);
      toast.success(`Reset agendado para ${formattedReset}.`);
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setScheduleResetConfirmError(
        apiError.message ?? "Não foi possível agendar o encerramento antecipado.",
      );
    } finally {
      setScheduleResetConfirmSaving(false);
    }
  };

  const handleOpenWindow = () => {
    setWindowError("");
    setShowWindowModal(true);
  };

  const handleWindowSubmit = async (payload: OpenEnrollmentWindowFormPayload) => {
    if (!activePeriod) return;
    setWindowSaving(true);
    setWindowError("");
    try {
      await enrollmentPeriodService.openWindow(activePeriod._id, payload);
      setShowWindowModal(false);
      toast.success("Janela de inscrição aberta com sucesso.");
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setWindowError(apiError.message ?? "Não foi possível abrir a janela de inscrição.");
    } finally {
      setWindowSaving(false);
    }
  };

  const handleCloseWindow = () => {
    if (!activePeriod) return;
    setShowCloseWindowConfirm(true);
  };

  const handleCloseWindowConfirmed = async () => {
    if (!activePeriod) return;
    setClosingWindow(true);
    try {
      await enrollmentPeriodService.closeWindow(activePeriod._id);
      setShowCloseWindowConfirm(false);
      toast.success("Janela de inscrição fechada com sucesso.");
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      toast.error(apiError.message ?? "Falha ao fechar a janela de inscrição.");
      setShowCloseWindowConfirm(false);
    } finally {
      setClosingWindow(false);
    }
  };

  // A janela só faz sentido abrir/editar/fechar com ciclo vivo —
  // activePeriod.startDate vem null quando não há janela ativa no momento.
  const hasOpenWindow = Boolean(activePeriod?.startDate);
  const canOpenWindow = Boolean(activePeriod && !hasOpenWindow);

  const cascadeImpactDescription = activePeriod
    ? `${waitlistEntries.length} pedido(s) na fila de espera serão cancelados definitivamente e a ocupação atual (${activePeriod.filledSlots} de ${activePeriod.totalSlots} vagas-dia) será liberada. Carteirinhas vinculadas a este período serão expiradas.`
    : "";

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
                      {hasOpenWindow && (
                        <>
                          <Button variant="outline" size="sm" onClick={handleOpenEdit}>
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleCloseWindow}>
                            Fechar janela
                          </Button>
                        </>
                      )}
                      {canOpenWindow && (
                        <Button variant="outline" size="sm" onClick={handleOpenWindow}>
                          Abrir janela de inscrição
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleOpenScheduleReset}>
                        Encerrar em X dias
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleClosePeriod}>
                        Encerrar período
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" size="sm" onClick={handleOpenCreatePeriod}>
                      Abrir novo período
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-on-surface-variant">Carregando período ativo...</p>
              ) : activePeriod ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Ciclo iniciado em</p>
                      <p className="font-medium text-on-surface">
                        {formatDate(activePeriod.cycleStartDate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Janela de inscrição atual</p>
                      <p className="font-medium text-on-surface">
                        {activePeriod.startDate && activePeriod.endDate
                          ? `${formatDate(activePeriod.startDate)} - ${formatDate(activePeriod.endDate)}`
                          : "Nenhuma janela aberta"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Validade da carteirinha</p>
                      <p className="font-medium text-on-surface">
                        {activePeriod.licenseValidityMonths} meses
                      </p>
                      {computeLicenseExpiry(activePeriod.cycleStartDate, activePeriod.licenseValidityMonths) && (
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          até{" "}
                          <strong className="text-on-surface">
                            {computeLicenseExpiry(activePeriod.cycleStartDate, activePeriod.licenseValidityMonths)}
                          </strong>
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Status</p>
                      <p className={`font-medium ${cycleStatus?.className}`}>
                        {cycleStatus?.label}
                      </p>
                      {cycleStatus?.supportText && (
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {cycleStatus.supportText}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface p-3">
                      <p className="text-xs text-on-surface-variant">Fila de espera</p>
                      <p className="font-medium text-on-surface">{waitlistEntries.length} aguardando</p>
                    </div>
                    {activePeriod.resetScheduledFor && (
                      <div className="rounded-xl border border-outline-variant bg-surface p-3">
                        <p className="text-xs text-on-surface-variant">Reset agendado para</p>
                        <p className="font-medium text-on-surface">
                          {formatDateTime(activePeriod.resetScheduledFor)}
                        </p>
                      </div>
                    )}
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
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Histórico de ciclos</h2>

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
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((period) => (
                        <tr key={period._id} className="border-t border-outline-variant/40 hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-3 py-2 text-on-surface">{formatDate(period.cycleStartDate)}</td>
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
              </PanelCard>
            )}
          </div>
        </main>

      <ReinforcedConfirmModal
        open={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseConfirmed}
        loading={closingPeriod}
        title="Encerrar período"
        description={cascadeImpactDescription}
        confirmWord="ENCERRAR"
        confirmLabel="Encerrar"
        cancelLabel="Cancelar"
      />

      <OpenPeriodModal
        open={showOpenPeriodModal}
        loading={openPeriodSaving}
        serverError={openPeriodError}
        onClose={() => {
          if (openPeriodSaving) return;
          setShowOpenPeriodModal(false);
        }}
        onSubmit={handleCreatePeriod}
      />

      {activePeriod && (
        <EnrollmentPeriodModal
          open={showEditModal}
          period={activePeriod}
          loading={periodSaving}
          serverError={periodModalError}
          onClose={() => {
            if (periodSaving) return;
            setShowEditModal(false);
          }}
          onSubmit={handleSavePeriod}
        />
      )}

      <ScheduleResetModal
        open={showScheduleResetModal}
        loading={false}
        serverError=""
        onClose={() => setShowScheduleResetModal(false)}
        onSubmit={handleScheduleResetSubmit}
      />

      <ReinforcedConfirmModal
        open={showScheduleResetConfirm}
        onClose={() => {
          if (scheduleResetConfirmSaving) return;
          setShowScheduleResetConfirm(false);
        }}
        onConfirm={handleScheduleResetConfirmed}
        loading={scheduleResetConfirmSaving}
        error={scheduleResetConfirmError}
        title="Confirmar encerramento em X dias"
        description={
          pendingResetDays != null
            ? `Isso agendará o encerramento em ${pendingResetDays} dia(s). Quando o prazo chegar, a mesma cascata do encerramento imediato roda automaticamente: ${cascadeImpactDescription}`
            : cascadeImpactDescription
        }
        confirmWord="ENCERRAR"
        confirmLabel="Agendar"
        cancelLabel="Cancelar"
      />

      <OpenEnrollmentWindowModal
        open={showWindowModal}
        loading={windowSaving}
        serverError={windowError}
        onClose={() => {
          if (windowSaving) return;
          setShowWindowModal(false);
        }}
        onSubmit={handleWindowSubmit}
      />

      <ConfirmModal
        open={showCloseWindowConfirm}
        onClose={() => setShowCloseWindowConfirm(false)}
        onConfirm={handleCloseWindowConfirmed}
        loading={closingWindow}
        title="Fechar janela"
        description="Deseja fechar a janela de inscrição atual? Novos alunos não poderão mais enviar solicitações até que uma nova janela seja aberta. O ciclo e a fila de espera não são afetados."
        icon={AlertTriangle}
        variant="warning"
        confirmLabel="Fechar janela"
        cancelLabel="Cancelar"
      />

      {/* Preview/confirm period-level release removed (use Bus UI) */}
    </>
  );
}


