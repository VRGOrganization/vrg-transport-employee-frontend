"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  AlarmClock,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CircleCheck,
  CircleDashed,
  DoorClosed,
  DoorOpen,
  Layers,
  PauseCircle,
  PlusCircle,
  RefreshCw,
  Timer,
  Users,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { http } from "@/services/http";
import {
  computeLicenseExpiry,
  formatDateBR,
  formatDateTimeBR,
} from "@/lib/utils/date";
import { resolvePaginated, type Paginated } from "@/types/api";
import type {
  LicenseRequestRecord,
  StudentRecord,
  StudentsResponse,
} from "@/types/cards.types";
import type { EnrollmentPeriod, WaitlistEntry } from "@/types/enrollmentPeriod";
import { resolveDisplayName } from "@/lib/utils/string";

// A edição atinge a janela ativa (startDate/endDate) e/ou a validade do ciclo
// (licenseValidityMonths); o modal envia apenas os campos que mudaram, por
// isso todos são opcionais.
type EnrollmentPeriodPayload = Partial<{
  startDate: string;
  endDate: string;
  licenseValidityMonths: number;
}>;

const VAGA_DIA_TOOLTIP =
  "Vagas em vaga-dia: 1 vaga de ônibus equivale a 5 (segunda a sexta). O total é a soma das vagas dos ônibus ativos × 5.";

const CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

// Sempre no fuso de Brasília: as datas são gravadas como instantes (a janela
// termina às 23:59:59.999 BRT, que em UTC já é o dia seguinte), então renderizar
// no fuso do navegador faria a data mostrada divergir da escolhida.
function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "-";
  const formatted = formatDateBR(dateValue);
  return formatted === "—" ? "-" : formatted;
}

function formatDateTime(dateValue: string | null | undefined): string {
  if (!dateValue) return "-";
  const formatted = formatDateTimeBR(dateValue);
  return formatted === "—" ? "-" : formatted;
}

function daysUntil(dateValue: string | null | undefined): number | null {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

// ————————————————————————————————————————————————————————————————
// Pequenos blocos de apresentação
// ————————————————————————————————————————————————————————————————

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm font-semibold text-on-surface">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-on-surface-variant">{hint}</p>}
      </div>
    </div>
  );
}

function EntityCard({
  icon: Icon,
  accent,
  title,
  subtitle,
  badge,
  actions,
  children,
}: {
  icon: LucideIcon;
  accent: "primary" | "secondary";
  title: string;
  subtitle: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const accentText = accent === "primary" ? "text-primary" : "text-secondary";
  const accentSoft = accent === "primary" ? "bg-primary/10" : "bg-secondary/10";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
      <header className="flex items-center justify-between gap-3 border-b border-outline-variant/60 bg-surface-container-low/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accentSoft, accentText)}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-on-surface">{title}</h3>
            <p className="truncate text-xs text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          {actions}
        </div>
      </header>
      <div className="flex-1 p-4">{children}</div>
    </article>
  );
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

  const [pendingPeriodPayload, setPendingPeriodPayload] = useState<EnrollmentPeriodPayload | null>(null);
  const [showValidityConfirm, setShowValidityConfirm] = useState(false);
  const [validityConfirmSaving, setValidityConfirmSaving] = useState(false);
  const [validityConfirmError, setValidityConfirmError] = useState("");

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
    if (Object.keys(payload).length === 0) {
      setShowEditModal(false);
      return;
    }

    // Mudar a validade da carteirinha desloca retroativamente a data de
    // expiração de todo aluno já alocado no ciclo — pede confirmação extra
    // quando há alunos afetados. Mudar só as datas da janela não afeta
    // carteirinha nenhuma e segue direto.
    const changesValidity =
      payload.licenseValidityMonths !== undefined &&
      payload.licenseValidityMonths !== activePeriod.licenseValidityMonths;
    if (changesValidity && activePeriod.filledSlots > 0) {
      setPendingPeriodPayload(payload);
      setShowEditModal(false);
      setValidityConfirmError("");
      setShowValidityConfirm(true);
      return;
    }

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

  const handleValidityConfirmed = async () => {
    if (!activePeriod || !pendingPeriodPayload) return;
    setValidityConfirmSaving(true);
    setValidityConfirmError("");
    try {
      await enrollmentPeriodService.update(activePeriod._id, pendingPeriodPayload);
      toast.success("Período atualizado com sucesso.");
      setShowValidityConfirm(false);
      setPendingPeriodPayload(null);
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setValidityConfirmError(apiError.message ?? "Não foi possível salvar o período.");
    } finally {
      setValidityConfirmSaving(false);
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

  const cascadeImpactDescription = activePeriod
    ? `${waitlistEntries.length} pedido(s) na fila de espera serão cancelados definitivamente e a ocupação atual (${activePeriod.filledSlots} de ${activePeriod.totalSlots} vagas-dia) será liberada. Carteirinhas vinculadas a este período serão expiradas.`
    : "";

  // ——— Valores derivados de apresentação ———
  const licenseValidUntil = activePeriod
    ? computeLicenseExpiry(activePeriod.cycleStartDate, activePeriod.licenseValidityMonths)
    : "";
  const occupancyPct = activePeriod ? Math.round(toProgressValue(activePeriod)) : 0;
  const windowDaysLeft = daysUntil(activePeriod?.endDate);

  const heroTone: "success" | "warning" | "neutral" = !activePeriod
    ? "neutral"
    : hasOpenWindow
      ? "success"
      : "warning";
  const HeroIcon = !activePeriod ? CircleDashed : hasOpenWindow ? CircleCheck : PauseCircle;
  const heroToneClasses = {
    success: { wrap: "bg-success/10", icon: "text-success", label: "text-success" },
    warning: { wrap: "bg-warning/10", icon: "text-warning", label: "text-warning" },
    neutral: { wrap: "bg-surface-container-high", icon: "text-on-surface-variant", label: "text-on-surface" },
  }[heroTone];
  const heroLabel = activePeriod ? cycleStatus!.label : "NENHUM PERÍODO ABERTO";
  const heroSupport = activePeriod
    ? cycleStatus!.supportText ?? "Os alunos podem enviar solicitações de carteirinha agora."
    : "Abra um novo período para começar a receber inscrições dos alunos.";

  return (
    <>
      <main className="px-6 py-5 bg-surface">
        <div className="w-full space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Período de Inscrição</h1>
              <p className="text-sm text-on-surface-variant">
                Gerencie o ciclo e as janelas de inscrição do transporte.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className={CHIP_CLASS}
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Atualizar
            </button>
          </header>

          {activePeriod?.endDate && (
            <EnrollmentPeriodBanner endDate={activePeriod.endDate} />
          )}

          {/* Faixa de status — resumo curto + ações do ciclo */}
          {loading && !activePeriod ? (
            <PanelCard className="p-4 sm:p-5">
              <div className="flex items-center gap-3.5">
                <span className="size-12 shrink-0 animate-pulse rounded-2xl bg-surface-container-high" />
                <div className="w-full space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-surface-container-high" />
                  <div className="h-3 w-64 animate-pulse rounded bg-surface-container-high" />
                </div>
              </div>
            </PanelCard>
          ) : (
            <PanelCard className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3.5">
                  <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", heroToneClasses.wrap)}>
                    <HeroIcon className={cn("size-6", heroToneClasses.icon)} />
                  </span>
                  <div className="min-w-0">
                    <h2 className={cn("text-sm font-bold tracking-wide", heroToneClasses.label)}>
                      {heroLabel}
                    </h2>
                    <p className="mt-0.5 text-sm text-on-surface-variant">{heroSupport}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activePeriod ? (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenScheduleReset}
                        className={CHIP_CLASS}
                      >
                        <AlarmClock className="size-4" />
                        Antecipar encerramento
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-error text-error hover:bg-error/10"
                        onClick={handleClosePeriod}
                      >
                        Encerrar período
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<PlusCircle className="size-4" />}
                      onClick={handleOpenCreatePeriod}
                    >
                      Abrir novo período
                    </Button>
                  )}
                </div>
              </div>
            </PanelCard>
          )}

          {/* Duas entidades lado a lado: o Ciclo e a Janela de inscrição */}
          {activePeriod && (
            <div className="grid gap-4 lg:grid-cols-2">
              <EntityCard
                icon={Layers}
                accent="primary"
                title="Ciclo atual"
                subtitle="Define a validade da carteirinha e a limpeza geral"
                badge={
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-primary">
                    ATIVO
                  </span>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Metric
                      icon={CalendarDays}
                      label="Ciclo iniciado em"
                      value={formatDate(activePeriod.cycleStartDate)}
                    />
                    <Metric
                      icon={BadgeCheck}
                      label="Validade da carteirinha"
                      value={`${activePeriod.licenseValidityMonths} meses`}
                      hint={
                        licenseValidUntil ? (
                          <>
                            válida até{" "}
                            <strong className="text-on-surface">{licenseValidUntil}</strong>
                          </>
                        ) : undefined
                      }
                    />
                    <Metric
                      icon={AlarmClock}
                      label="Limpeza geral (reset)"
                      value={
                        activePeriod.resetScheduledFor
                          ? formatDateTime(activePeriod.resetScheduledFor)
                          : "No fim do ciclo"
                      }
                      hint={
                        activePeriod.resetScheduledFor
                          ? "cascata automática nesta data"
                          : `≈ ${activePeriod.licenseValidityMonths} meses após a abertura`
                      }
                    />
                    <Metric
                      icon={Users}
                      label="Fila de espera"
                      value={`${waitlistEntries.length} aguardando`}
                    />
                  </div>

                  <div className="rounded-xl border border-outline-variant/60 bg-surface p-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        Ocupação (vaga-dia)
                        <InfoTooltip ariaLabel="O que é vaga-dia?" content={VAGA_DIA_TOOLTIP} />
                      </span>
                      <span className="font-semibold text-on-surface">
                        {activePeriod.filledSlots} / {activePeriod.totalSlots}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-on-surface-variant">
                      {occupancyPct}% das vagas-dia ocupadas
                    </p>
                  </div>
                </div>
              </EntityCard>

              <EntityCard
                icon={hasOpenWindow ? DoorOpen : DoorClosed}
                accent="secondary"
                title="Janela de inscrição"
                subtitle="Quem pode enviar solicitações agora"
                badge={
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide",
                      hasOpenWindow
                        ? "bg-success/15 text-success"
                        : "bg-warning/15 text-on-warning",
                    )}
                  >
                    {hasOpenWindow ? "ABERTA" : "FECHADA"}
                  </span>
                }
                actions={
                  hasOpenWindow ? (
                    <>
                      <button type="button" onClick={handleOpenEdit} className={CHIP_CLASS}>
                        Editar janela
                      </button>
                      <button type="button" onClick={handleCloseWindow} className={CHIP_CLASS}>
                        Fechar janela
                      </button>
                    </>
                  ) : undefined
                }
              >
                {hasOpenWindow ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Metric
                        icon={CalendarDays}
                        label="Início da janela"
                        value={formatDate(activePeriod.startDate)}
                      />
                      <Metric
                        icon={CalendarDays}
                        label="Fim da janela"
                        value={formatDate(activePeriod.endDate)}
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-3 py-2.5 text-sm text-on-surface">
                      <Timer className="size-4 shrink-0 text-secondary" />
                      <span>
                        {windowDaysLeft != null && windowDaysLeft > 0
                          ? `Encerra em ${windowDaysLeft} dia${windowDaysLeft > 1 ? "s" : ""}.`
                          : windowDaysLeft === 0
                            ? "Encerra hoje."
                            : "Prazo da janela expirado — será fechada na próxima verificação."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-start gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 p-4">
                    <p className="text-sm text-on-surface-variant">
                      A equipe segue processando a fila normalmente. Abra uma nova janela
                      de inscrição para voltar a receber novas solicitações.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<DoorOpen className="size-4" />}
                      onClick={handleOpenWindow}
                    >
                      Abrir janela de inscrição
                    </Button>
                  </div>
                )}
              </EntityCard>
            </div>
          )}

          {/* Fila de espera do ciclo — visível mesmo sem janela aberta */}
          {activePeriod && (
            <PanelCard as="section" className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
                    Fila de espera
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                      {waitlistEntries.length}
                    </span>
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Alunos aguardando vaga neste ciclo. A fila continua visível mesmo sem
                    janela de inscrição aberta.
                  </p>
                </div>
              </div>

              {waitlistEntries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/30 px-4 py-10 text-center">
                  <Users className="size-6 text-on-surface-variant/60" />
                  <p className="text-sm text-on-surface-variant">
                    Nenhum aluno na fila de espera.
                  </p>
                </div>
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
                          <td className="px-3 py-2 text-on-surface">{resolveDisplayName(entry.student)}</td>
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

          {/* Histórico de ciclos */}
          <PanelCard as="section" className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-on-surface">Histórico de ciclos</h2>

            {periods.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/30 px-4 py-10 text-center">
                <Layers className="size-6 text-on-surface-variant/60" />
                <p className="text-sm text-on-surface-variant">Nenhum período cadastrado ainda.</p>
              </div>
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
                          <InfoTooltip ariaLabel="O que é vaga-dia?" content={VAGA_DIA_TOOLTIP} />
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
        </div>
      </main>

      <ReinforcedConfirmModal
        open={showCloseConfirm}
        onClose={() => {
          if (closingPeriod) return;
          setShowCloseConfirm(false);
        }}
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

      {activePeriod && pendingPeriodPayload?.licenseValidityMonths !== undefined && (
        <ConfirmModal
          open={showValidityConfirm}
          onClose={() => {
            if (validityConfirmSaving) return;
            setShowValidityConfirm(false);
            setPendingPeriodPayload(null);
          }}
          onConfirm={handleValidityConfirmed}
          loading={validityConfirmSaving}
          error={validityConfirmError}
          title="Alterar validade da carteirinha?"
          icon={AlertTriangle}
          variant="warning"
          description={
            <>
              A validade muda de <strong>{activePeriod.licenseValidityMonths} meses</strong> (válida até{" "}
              <strong>{computeLicenseExpiry(activePeriod.cycleStartDate, activePeriod.licenseValidityMonths)}</strong>) para{" "}
              <strong>{pendingPeriodPayload.licenseValidityMonths} meses</strong> (válida até{" "}
              <strong>{computeLicenseExpiry(activePeriod.cycleStartDate, pendingPeriodPayload.licenseValidityMonths)}</strong>).
              Isso afeta a expiração da carteirinha de todos os {activePeriod.filledSlots} aluno(s) já alocados neste ciclo.
            </>
          }
          confirmLabel="Confirmar alteração"
          cancelLabel="Cancelar"
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
        title="Confirmar antecipação do encerramento"
        description={
          pendingResetDays != null
            ? `Isso agendará o encerramento em ${pendingResetDays} dia(s). Quando o prazo chegar, a mesma cascata do encerramento imediato roda automaticamente. Números atuais, podem mudar até lá: ${cascadeImpactDescription}`
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
        cycleStartDate={activePeriod?.cycleStartDate ?? ""}
        cycleEndDate={activePeriod?.resetScheduledFor ?? ""}
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
    </>
  );
}
