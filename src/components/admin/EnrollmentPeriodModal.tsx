"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/dist/style.css";
import { addMonths, format, parseISO, startOfDay } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { busApi } from "@/lib/universityApi";
import type { EnrollmentPeriod } from "@/types/enrollmentPeriod";

interface EnrollmentPeriodFormPayload {
  startDate: string;
  endDate: string;
  totalSlots: number;
  licenseValidityMonths: number;
}

interface EnrollmentPeriodModalProps {
  open: boolean;
  period: EnrollmentPeriod | null;
  loading: boolean;
  serverError: string;
  onClose: () => void;
  onSubmit: (payload: EnrollmentPeriodFormPayload) => Promise<void>;
}

interface FormState {
  startDate: string;
  endDate: string;
  totalSlots: string;
  licenseValidityMonths: string;
}

interface FormErrors {
  startDate: string;
  endDate: string;
  totalSlots: string;
  licenseValidityMonths: string;
  general: string;
}

const EMPTY_ERRORS: FormErrors = {
  startDate: "",
  endDate: "",
  totalSlots: "",
  licenseValidityMonths: "",
  general: "",
};

function toInputDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function isoToBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function parseBRDate(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, dd, mm, yyyy] = match;
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return iso;
}

function buildInitialForm(period: EnrollmentPeriod | null): FormState {
  if (!period) {
    return {
      startDate: "",
      endDate: "",
      totalSlots: "",
      licenseValidityMonths: "6",
    };
  }

  return {
    startDate: toInputDate(period.startDate),
    endDate: toInputDate(period.endDate),
    totalSlots: String(period.totalSlots),
    licenseValidityMonths: String(period.licenseValidityMonths),
  };
}

export function EnrollmentPeriodModal({
  open,
  period,
  loading,
  serverError,
  onClose,
  onSubmit,
}: EnrollmentPeriodModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(period));
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [startDateText, setStartDateText] = useState<string>(() => isoToBR(buildInitialForm(period).startDate));
  const [endDateText, setEndDateText] = useState<string>(() => isoToBR(buildInitialForm(period).endDate));
  const [busCount, setBusCount] = useState<number>(0);
  const [maxSlotsFromBuses, setMaxSlotsFromBuses] = useState<number>(0);
  const [loadingBusMin, setLoadingBusMin] = useState<boolean>(false);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (!period) return undefined;
    const from = period.startDate ? new Date(period.startDate) : undefined;
    const to = period.endDate ? new Date(period.endDate) : undefined;
    return { from, to } as DateRange;
  });
  // FIX: Always show 1 month on mobile, 2 on desktop
  const [months, setMonths] = useState<number>(
    typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2
  );

  useEffect(() => {
    if (!open) return;
    const initial = buildInitialForm(period);
    setForm(initial);
    setErrors(EMPTY_ERRORS);
    setStartDateText(isoToBR(initial.startDate));
    setEndDateText(isoToBR(initial.endDate));
    setRange(() => {
      if (!period) return undefined;
      const from = period.startDate ? new Date(period.startDate) : undefined;
      const to = period.endDate ? new Date(period.endDate) : undefined;
      return { from, to } as DateRange;
    });
  }, [open, period]);

  useEffect(() => {
    if (!open) return;
    const update = () => setMonths(window.innerWidth < 640 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mountState = { cancelled: false };

    const load = async () => {
      setLoadingBusMin(true);
      try {
        const buses = await busApi.listWithQueueCounts();
        if (mountState.cancelled) return;
        const allBuses = Array.isArray(buses) ? buses : [];
        const totalCapacity = allBuses.reduce((acc: number, b: any) => {
          const cap = b?.capacity;
          return typeof cap === "number" && cap > 0 ? acc + cap : acc;
        }, 0);
        if (!mountState.cancelled) {
          setBusCount(allBuses.length);
          setMaxSlotsFromBuses(totalCapacity);
        }
      } catch (e) {
        if (!mountState.cancelled) {
          setBusCount(0);
          setMaxSlotsFromBuses(0);
        }
      } finally {
        if (!mountState.cancelled) setLoadingBusMin(false);
      }
    };

    void load();
    return () => {
      mountState.cancelled = true;
    };
  }, [open]);

  const minAllowedSlots = useMemo(() => {
    return period?.filledSlots ?? 0;
  }, [period]);

  const maxAllowedSlots = useMemo(() => {
    return maxSlotsFromBuses > 0 ? maxSlotsFromBuses : null;
  }, [maxSlotsFromBuses]);

  const licenseExpiryDate = useMemo(() => {
    if (!form.endDate) return null;
    const m = Number(form.licenseValidityMonths);
    if (!Number.isInteger(m) || m < 1) return null;
    try {
      const base = new Date(`${form.endDate}T00:00:00`);
      if (Number.isNaN(base.getTime())) return null;
      return format(addMonths(base, m), "dd/MM/yyyy");
    } catch {
      return null;
    }
  }, [form.endDate, form.licenseValidityMonths]);

  const totalSlotsNumber = Number(form.totalSlots) || 0;

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const handleRangeSelect = (nextRange: DateRange | undefined) => {
    setRange(nextRange);
    const from = nextRange?.from ? toInputDate(nextRange.from.toISOString()) : "";
    const to = nextRange?.to ? toInputDate(nextRange.to.toISOString()) : "";
    setForm((prev) => ({ ...prev, startDate: from, endDate: to }));
    setErrors((prev) => ({ ...prev, startDate: "", endDate: "", general: "" }));
    setStartDateText(isoToBR(from));
    setEndDateText(isoToBR(to));
  };

  const handleStartDateInput = (iso: string) => {
    setErrors((prev) => ({ ...prev, startDate: "", endDate: "", general: "" }));
    const from = iso ? new Date(`${iso}T00:00:00`) : undefined;
    const currentTo = form.endDate ? new Date(`${form.endDate}T00:00:00`) : undefined;
    const validTo = from && currentTo && from >= currentTo ? undefined : currentTo;
    const newEndDate = validTo ? form.endDate : "";
    if (!validTo) setEndDateText("");
    setForm((prev) => ({ ...prev, startDate: iso, endDate: newEndDate }));
    setRange(from || validTo ? { from, to: validTo } : undefined);
  };

  const handleEndDateInput = (iso: string) => {
    setErrors((prev) => ({ ...prev, endDate: "", general: "" }));
    const from = form.startDate ? new Date(`${form.startDate}T00:00:00`) : undefined;
    const to = iso ? new Date(`${iso}T00:00:00`) : undefined;
    setForm((prev) => ({ ...prev, endDate: iso }));
    setRange(from || to ? { from, to } : undefined);
  };

  const handleStartDateText = (raw: string) => {
    const clean = raw.replace(/[^\d/]/g, "").slice(0, 10);
    setStartDateText(clean);
    const iso = parseBRDate(clean);
    if (iso) handleStartDateInput(iso);
    else if (!clean) handleStartDateInput("");
  };

  const handleEndDateText = (raw: string) => {
    const clean = raw.replace(/[^\d/]/g, "").slice(0, 10);
    setEndDateText(clean);
    const iso = parseBRDate(clean);
    if (iso) handleEndDateInput(iso);
    else if (!clean) handleEndDateInput("");
  };

  const validate = (): EnrollmentPeriodFormPayload | null => {
    const nextErrors: FormErrors = { ...EMPTY_ERRORS };

    if (!form.startDate) nextErrors.startDate = "Data de início é obrigatória.";
    if (!form.endDate) nextErrors.endDate = "Data de fim é obrigatória.";

    const totalSlots = Number(form.totalSlots);
    const licenseValidityMonths = Number(form.licenseValidityMonths);

    if (!Number.isInteger(totalSlots) || totalSlots < 1) {
      nextErrors.totalSlots = "Quantidade de vagas deve ser maior ou igual a 1.";
    } else if (minAllowedSlots > 0 && totalSlots < minAllowedSlots) {
      nextErrors.totalSlots = `Quantidade de vagas não pode ser menor que ${minAllowedSlots} (vagas já preenchidas).`;
    } else if (maxAllowedSlots !== null && totalSlots > maxAllowedSlots) {
      nextErrors.totalSlots = `Quantidade de vagas não pode exceder a capacidade total dos ônibus (${maxAllowedSlots} vagas).`;
    }

    if (!Number.isInteger(licenseValidityMonths) || licenseValidityMonths < 1) {
      nextErrors.licenseValidityMonths =
        "Validade deve ser maior ou igual a 1 mês.";
    }

    if (form.startDate && form.endDate) {
      const start = new Date(`${form.startDate}T00:00:00.000Z`);
      const end = new Date(`${form.endDate}T23:59:59.999Z`);
      if (end <= start) {
        nextErrors.endDate =
          "Data de fim deve ser maior que a data de início.";
      }
    }

    const hasErrors = Object.values(nextErrors).some(
      (value) => value.length > 0
    );
    setErrors(nextErrors);

    if (hasErrors) return null;

    return {
      startDate: `${form.startDate}T00:00:00.000Z`,
      endDate: `${form.endDate}T23:59:59.999Z`,
      totalSlots,
      licenseValidityMonths,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = validate();
    if (!payload) return;
    await onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="xl"
      title={period ? "Editar período de inscrição" : "Abrir novo período de inscrição"}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-on-surface">Período</label>
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
            <DayPicker
              className="edp-picker"
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              numberOfMonths={months}
              locale={ptBR}
              disabled={{ before: startOfDay(new Date()) }}
              styles={{
                months: {
                  display: "grid",
                  gridTemplateColumns: months === 2 ? "repeat(2, minmax(0, 1fr))" : "1fr",
                  gap: "16px",
                  width: "100%",
                  maxWidth: "100%",
                },
                month: { width: "100%", minWidth: 0 },
              }}
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                  Data de início
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={startDateText}
                  onChange={(e) => handleStartDateText(e.target.value)}
                  onBlur={() => {
                    const iso = parseBRDate(startDateText);
                    if (iso) setStartDateText(isoToBR(iso));
                  }}
                  className="h-11 w-full rounded-xl border-2 border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                  Data de fim
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={endDateText}
                  disabled={!form.startDate}
                  onChange={(e) => handleEndDateText(e.target.value)}
                  onBlur={() => {
                    const iso = parseBRDate(endDateText);
                    if (iso) setEndDateText(isoToBR(iso));
                  }}
                  className="h-11 w-full rounded-xl border-2 border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            {(form.startDate || form.endDate) && (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRangeSelect(undefined)}
                >
                  Limpar datas
                </Button>
              </div>
            )}
          </div>
          {errors.startDate && <p className="mt-1 text-xs text-error">{errors.startDate}</p>}
          {errors.endDate && <p className="mt-1 text-xs text-error">{errors.endDate}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Quantidade de vagas
            </label>
            <input
              type="number"
              min={Math.max(minAllowedSlots, 1)}
              max={maxAllowedSlots ?? undefined}
              step={1}
              value={form.totalSlots}
              onChange={(event) => setField("totalSlots", event.target.value)}
              className="h-11 w-full rounded-xl border-2 border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: 100"
            />
            {errors.totalSlots ? (
              <p className="mt-1 text-xs text-error">{errors.totalSlots}</p>
            ) : loadingBusMin ? (
              <p className="mt-1 text-xs text-on-surface-variant">Carregando frota...</p>
            ) : busCount > 0 ? (
              <p className="mt-1 text-xs text-on-surface-variant">
                {busCount} ônibus cadastrado{busCount !== 1 ? "s" : ""} · Máx. {maxSlotsFromBuses} vagas
              </p>
            ) : (
              <p className="mt-1 text-xs text-on-surface-variant">Nenhum ônibus cadastrado.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Validade da carteirinha (meses)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={form.licenseValidityMonths}
              onChange={(event) => setField("licenseValidityMonths", event.target.value)}
              className="h-11 w-full rounded-xl border-2 border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: 6"
            />
            {errors.licenseValidityMonths ? (
              <p className="mt-1 text-xs text-error">{errors.licenseValidityMonths}</p>
            ) : licenseExpiryDate ? (
              <p className="mt-1 text-xs text-on-surface-variant">
                Carteirinhas vencerão em <strong className="text-on-surface">{licenseExpiryDate}</strong>.
              </p>
            ) : (
              <p className="mt-1 text-xs text-on-surface-variant">
                Defina o período acima para ver a data de vencimento.
              </p>
            )}
          </div>
        </div>

        {(errors.general || serverError) && (
          <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {errors.general || serverError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            {period ? "Salvar alterações" : "Abrir período"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
