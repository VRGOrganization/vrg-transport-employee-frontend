"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  brDayEndISO,
  brDayStartISO,
  formatDateBR,
  toCivilBR,
} from "@/lib/utils/date";
import type { EnrollmentPeriod } from "@/types/enrollmentPeriod";

import { enrollmentWindowScopeLabel } from "./enrollmentWindowScope";

// Só as datas da JANELA. Validade da carteirinha e capacidade são do CICLO —
// a primeira sai pelo EnrollmentCycleEditModal, a segunda é derivada dos
// ônibus ativos e não é editável em lugar nenhum.
export type EnrollmentPeriodFormPayload = Partial<{
  startDate: string;
  endDate: string;
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
}

interface FormErrors {
  startDate: string;
  endDate: string;
  general: string;
}

const EMPTY_ERRORS: FormErrors = {
  startDate: "",
  endDate: "",
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

  const validate = (): EnrollmentPeriodFormPayload | null => {
    const nextErrors: FormErrors = { ...EMPTY_ERRORS };
    const initial = buildInitialForm(period);

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

    const hasErrors = Object.values(nextErrors).some((value) => value.length > 0);
    if (hasErrors) {
      setErrors(nextErrors);
      return null;
    }

    // Envia apenas os campos que mudaram.
    const payload: EnrollmentPeriodFormPayload = {};
    if (form.startDate !== initial.startDate) {
      payload.startDate = brDayStartISO(form.startDate);
    }
    if (form.endDate !== initial.endDate) {
      payload.endDate = brDayEndISO(form.endDate);
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
      title="Editar janela de inscrição"
    >
      {hasOpenWindow ? (
        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Janela de inscrição ativa
            </label>
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
          </div>

          <EligibilityScopeSummary period={period} />

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
      ) : (
        <div className="space-y-3">
          <p className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
            Nenhuma janela aberta. Abra uma janela de inscrição para ajustar as
            datas.
          </p>
          {serverError && (
            <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
              {serverError}
            </div>
          )}
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Com qual opção a janela foi aberta — leitura, nunca edição. */
function EligibilityScopeSummary({ period }: { period: EnrollmentPeriod }) {
  const universities = period.eligibleUniversities ?? [];

  return (
    <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2.5">
      <p className="text-xs font-medium text-on-surface-variant">Aberta para</p>
      <p className="mt-0.5 text-sm font-medium text-on-surface">
        {enrollmentWindowScopeLabel(period.eligibilityScope)}
      </p>

      {period.eligibilityScope === "specific_universities" && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {universities.length > 0 ? (
            universities.map((university) => (
              <span
                key={university._id}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                title={university.name}
              >
                {university.acronym}: {university.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-on-surface-variant">
              Nenhuma faculdade elegível encontrada.
            </span>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-on-surface-variant">
        Para mudar quem participa, feche esta janela e abra uma nova.
      </p>
    </div>
  );
}
