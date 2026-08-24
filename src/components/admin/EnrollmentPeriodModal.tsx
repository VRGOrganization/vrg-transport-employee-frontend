"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  brDayEndISO,
  brDayStartISO,
  computeLicenseExpiry,
  formatDateBR,
  toCivilBR,
} from "@/lib/utils/date";
import type { EnrollmentPeriod } from "@/types/enrollmentPeriod";

// Só os campos alterados são enviados — startDate/endDate editam a JANELA ativa,
// licenseValidityMonths edita o ciclo. O início do ciclo (cycleStartDate) não
// é editável por aqui.
export type EnrollmentPeriodFormPayload = Partial<{
  startDate: string;
  endDate: string;
  licenseValidityMonths: number;
}>;

interface EnrollmentPeriodModalProps {
  open: boolean;
  period: EnrollmentPeriod;
  loading: boolean;
  serverError: string;
  onClose: () => void;
  onSubmit: (payload: EnrollmentPeriodFormPayload) => Promise<void>;
}

interface FormState {
  startDate: string;
  endDate: string;
  licenseValidityMonths: string;
}

interface FormErrors {
  startDate: string;
  endDate: string;
  licenseValidityMonths: string;
  general: string;
}

const EMPTY_ERRORS: FormErrors = {
  startDate: "",
  endDate: "",
  licenseValidityMonths: "",
  general: "",
};

// A data do input é a data civil de Brasília, não a de UTC: o fim da janela é
// gravado às 23:59:59.999 BRT, que em UTC já é o dia seguinte.
function toInputDate(value: string | null | undefined): string {
  if (!value) return "";
  return toCivilBR(value);
}

function buildInitialForm(period: EnrollmentPeriod): FormState {
  return {
    startDate: toInputDate(period.startDate),
    endDate: toInputDate(period.endDate),
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
  // As datas só são editáveis enquanto houver janela aberta; sem janela, apenas
  // a validade do ciclo pode ser ajustada.
  const hasOpenWindow = Boolean(period.startDate && period.endDate);

  // A janela vive dentro do ciclo: do início do ciclo até o encerramento
  // previsto (resetScheduledFor). Mesmos limites que o backend aplica.
  const minCivil = toCivilBR(period.cycleStartDate);
  const maxCivil = period.resetScheduledFor
    ? toCivilBR(period.resetScheduledFor)
    : "";

  const [form, setForm] = useState<FormState>(() => buildInitialForm(period));
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  // Reseta o form a cada abertura sem efeito — mesmo padrão dos outros modais
  // deste diretório (comparação com prevOpen).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(buildInitialForm(period));
      setErrors(EMPTY_ERRORS);
    }
  }

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  // Validade sempre ancorada em cycleStartDate (início real do ciclo), nunca
  // na janela — calculada em UTC, igual ao backend.
  const licenseExpiryDate = (() => {
    const months = Number(form.licenseValidityMonths);
    if (!Number.isInteger(months) || months < 1) return "";
    return computeLicenseExpiry(period.cycleStartDate, months);
  })();

  const validate = (): EnrollmentPeriodFormPayload | null => {
    const nextErrors: FormErrors = { ...EMPTY_ERRORS };
    const initial = buildInitialForm(period);

    const licenseValidityMonths = Number(form.licenseValidityMonths);
    if (!Number.isInteger(licenseValidityMonths) || licenseValidityMonths < 1) {
      nextErrors.licenseValidityMonths = "Validade deve ser maior ou igual a 1 mês.";
    }

    if (hasOpenWindow) {
      if (!form.startDate) nextErrors.startDate = "Data de início é obrigatória.";
      if (!form.endDate) nextErrors.endDate = "Data de fim é obrigatória.";
      if (form.startDate && form.endDate) {
        const start = new Date(brDayStartISO(form.startDate));
        const end = new Date(brDayEndISO(form.endDate));
        if (end <= start) {
          nextErrors.endDate = "Data de fim deve ser maior que a data de início.";
        }
      }
      if (form.startDate && minCivil && form.startDate < minCivil) {
        nextErrors.startDate = `A janela não pode começar antes do início do ciclo (${formatDateBR(period.cycleStartDate)}).`;
      }
      if (form.endDate && maxCivil && form.endDate > maxCivil) {
        nextErrors.endDate = `A janela não pode terminar depois do encerramento do ciclo (${formatDateBR(period.resetScheduledFor)}).`;
      }
    }

    const hasErrors = Object.values(nextErrors).some((value) => value.length > 0);
    if (hasErrors) {
      setErrors(nextErrors);
      return null;
    }

    // Envia apenas os campos que mudaram.
    const payload: EnrollmentPeriodFormPayload = {};
    if (hasOpenWindow && form.startDate !== initial.startDate) {
      payload.startDate = brDayStartISO(form.startDate);
    }
    if (hasOpenWindow && form.endDate !== initial.endDate) {
      payload.endDate = brDayEndISO(form.endDate);
    }
    if (form.licenseValidityMonths !== initial.licenseValidityMonths) {
      payload.licenseValidityMonths = licenseValidityMonths;
    }

    if (Object.keys(payload).length === 0) {
      setErrors({ ...EMPTY_ERRORS, general: "Nenhuma alteração para salvar." });
      return null;
    }

    setErrors(EMPTY_ERRORS);
    return payload;
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
      size="lg"
      title="Editar período de inscrição"
    >
      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-on-surface">
            Janela de inscrição ativa
          </label>
          {hasOpenWindow ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-window-start"
                  className="mb-0.5 block text-xs font-medium text-on-surface-variant"
                >
                  Data de início
                </label>
                <input
                  id="edit-window-start"
                  type="date"
                  min={minCivil}
                  max={maxCivil}
                  value={form.startDate}
                  onChange={(event) => setField("startDate", event.target.value)}
                  className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-error">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="edit-window-end"
                  className="mb-0.5 block text-xs font-medium text-on-surface-variant"
                >
                  Data de fim
                </label>
                <input
                  id="edit-window-end"
                  type="date"
                  min={form.startDate || minCivil}
                  max={maxCivil}
                  value={form.endDate}
                  onChange={(event) => setField("endDate", event.target.value)}
                  className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-error">{errors.endDate}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
              Nenhuma janela aberta. Só a validade da carteirinha pode ser editada.
              Abra uma janela de inscrição para ajustar as datas.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-0.5 block text-sm font-medium text-on-surface">
              Capacidade (vagas-dia)
            </label>
            <div className="h-9 flex items-center rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 text-sm text-on-surface-variant">
              {period.totalSlots} vagas-dia (derivado dos ônibus)
            </div>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Capacidade = soma dos ônibus ativos × dias úteis. Não editável.
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-validity-months"
              className="mb-0.5 block text-sm font-medium text-on-surface"
            >
              Validade da carteirinha (meses)
            </label>
            <input
              id="edit-validity-months"
              type="number"
              min={1}
              step={1}
              value={form.licenseValidityMonths}
              onChange={(event) => setField("licenseValidityMonths", event.target.value)}
              className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: 6"
            />
            {errors.licenseValidityMonths ? (
              <p className="mt-0.5 text-xs text-error">{errors.licenseValidityMonths}</p>
            ) : licenseExpiryDate ? (
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Carteirinhas válidas até{" "}
                <strong className="text-on-surface">{licenseExpiryDate}</strong>{" "}
                (a partir do início do ciclo).
              </p>
            ) : null}
          </div>
        </div>

        {(errors.general || serverError) && (
          <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {errors.general || serverError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
