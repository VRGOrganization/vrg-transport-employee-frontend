"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/dist/style.css";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
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
  const [minSlotsFromBuses, setMinSlotsFromBuses] = useState<number>(0);
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
    setForm(buildInitialForm(period));
    setErrors(EMPTY_ERRORS);
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
    let cancelled = false;

    const load = async () => {
      setLoadingBusMin(true);
      try {
        const buses = await busApi.list();
        if (cancelled) return;
        let sum = 0;
        if (Array.isArray(buses)) {
          for (const b of buses) {
            const cap = (b as any)?.capacity;
            if (typeof cap === "number" && cap > 0) sum += cap;
          }
        }
        if (!cancelled) setMinSlotsFromBuses(sum);
      } catch (e) {
        if (!cancelled) setMinSlotsFromBuses(0);
      } finally {
        if (!cancelled) setLoadingBusMin(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const minAllowedSlots = useMemo(() => {
    const periodFilled = period?.filledSlots ?? 0;
    return Math.max(periodFilled, minSlotsFromBuses ?? 0);
  }, [period, minSlotsFromBuses]);

  const totalSlotsNumber = Number(form.totalSlots) || 0;
  const showOverCapacityWarning =
    !loadingBusMin &&
    (minSlotsFromBuses ?? 0) > 0 &&
    totalSlotsNumber > (minSlotsFromBuses ?? 0);

  if (!open) return null;

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const handleRangeSelect = (nextRange: DateRange | undefined) => {
    setRange(nextRange);
    const from = nextRange?.from
      ? toInputDate(nextRange.from.toISOString())
      : "";
    const to = nextRange?.to ? toInputDate(nextRange.to.toISOString()) : "";
    setForm((prev) => ({ ...prev, startDate: from, endDate: to }));
    setErrors((prev) => ({
      ...prev,
      startDate: "",
      endDate: "",
      general: "",
    }));
  };

  function formatDisplayDate(value: string | null | undefined): string {
    if (!value) return "—";
    try {
      const d = parseISO(value);
      if (Number.isNaN(d.getTime())) return "—";
      return format(d, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  }

  const validate = (): EnrollmentPeriodFormPayload | null => {
    const nextErrors: FormErrors = { ...EMPTY_ERRORS };

    if (!form.startDate) nextErrors.startDate = "Data de início é obrigatória.";
    if (!form.endDate) nextErrors.endDate = "Data de fim é obrigatória.";

    const totalSlots = Number(form.totalSlots);
    const licenseValidityMonths = Number(form.licenseValidityMonths);

    if (!Number.isInteger(totalSlots) || totalSlots < 1) {
      nextErrors.totalSlots =
        "Quantidade de vagas deve ser maior ou igual a 1.";
    }

    if (totalSlots < minAllowedSlots) {
      nextErrors.totalSlots = `Quantidade de vagas não pode ser menor que ${minAllowedSlots}.`;
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
    <>
      {/* FIX: Scoped styles — no more conflicting global selectors */}
      <style>{`
        /* react-day-picker v9 CSS variables */
        .edp-picker {
          --rdp-accent-color: #003f87;
          --rdp-accent-background-color: #d7e2ff;
          --rdp-day-height: 36px;
          --rdp-day-width: 36px;
          --rdp-day_button-height: 34px;
          --rdp-day_button-width: 34px;
          width: 100%;
        }

        /* Months container — override fit-content and force grid layout */
        .edp-picker .rdp-months {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
          max-width: 100% !important;
        }

        /* Each month fills its grid cell */
        .edp-picker .rdp-month { width: 100%; min-width: 0; }

        /* Weekday headers — v9 uses .rdp-weekday instead of .rdp-head_cell */
        .edp-picker .rdp-weekday {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Table layout fix — v9 uses .rdp-month_grid instead of table */
        .edp-picker .rdp-month_grid {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
        }
        .edp-picker .rdp-month_grid td,
        .edp-picker .rdp-month_grid th {
          padding: 1px;
          text-align: center;
        }

        @media (max-width: 640px) {
          .edp-picker {
            --rdp-day-height: 30px;
            --rdp-day-width: 30px;
            --rdp-day_button-height: 28px;
            --rdp-day_button-width: 28px;
          }
          .edp-picker .rdp-weekday { font-size: 10px; }
          .edp-picker .rdp-months { grid-template-columns: 1fr; gap: 8px; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(event) => {
          if (event.currentTarget === event.target && !loading) onClose();
        }}
      >
        {/* FIX: max-w widened to accommodate two-month calendar */}
        <div className="w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-on-surface">
              {period
                ? "Editar período de inscrição"
                : "Abrir novo período de inscrição"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container"
              aria-label="Fechar modal"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Calendar section — full width, no grid column constraint */}
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">
                Período
              </label>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                <DayPicker
                  className="edp-picker"
                  mode="range"
                  selected={range}
                  onSelect={handleRangeSelect}
                  numberOfMonths={months}
                  locale={ptBR}
                />

                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm text-on-surface-variant">
                    <span>
                      Início: {" "}
                      <strong>{formatDisplayDate(form.startDate)}</strong>
                    </span>
                    {"  ·  "}
                    <span>
                      Fim: {" "}
                      <strong>{formatDisplayDate(form.endDate)}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-outline-variant px-3 py-1 text-sm text-on-surface-variant hover:bg-surface-container"
                    onClick={() => handleRangeSelect(undefined)}
                  >
                    Limpar datas
                  </button>
                </div>
              </div>

              {errors.startDate && (
                <p className="mt-1 text-xs text-error">{errors.startDate}</p>
              )}
              {errors.endDate && (
                <p className="mt-1 text-xs text-error">{errors.endDate}</p>
              )}
            </div>

            {/* Slots + validity side by side */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">
                  Quantidade de vagas
                </label>
                <input
                  type="number"
                  min={Math.max(minAllowedSlots, 1)}
                  step={1}
                  value={form.totalSlots}
                  onChange={(event) =>
                    setField("totalSlots", event.target.value)
                  }
                  className="h-10 w-full rounded-xl border-2 border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: 100"
                />
                {errors.totalSlots ? (
                  <p className="mt-1 text-xs text-error">
                    {errors.totalSlots}
                  </p>
                ) : loadingBusMin ? (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Carregando capacidades dos ônibus...
                  </p>
                ) : (
                  minSlotsFromBuses > 0 &&
                  (showOverCapacityWarning ? (
                    <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      A quantidade de vagas ({totalSlotsNumber}) é maior que a
                      soma das capacidades dos ônibus ({minSlotsFromBuses}).
                      Isso é permitido, mas verifique se é intencional.
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Soma das capacidades dos ônibus: {minSlotsFromBuses}{" "}
                      vagas.
                    </p>
                  ))
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
                  onChange={(event) =>
                    setField("licenseValidityMonths", event.target.value)
                  }
                  className="h-10 w-full rounded-xl border-2 border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: 6"
                />
                {errors.licenseValidityMonths && (
                  <p className="mt-1 text-xs text-error">
                    {errors.licenseValidityMonths}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-on-surface-variant">
              Carteirinhas emitidas neste período expirarão conforme a validade
              em meses definida acima.
            </p>

            {(errors.general || serverError) && (
              <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                {errors.general || serverError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading}>
                {period ? "Salvar alterações" : "Abrir período"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}