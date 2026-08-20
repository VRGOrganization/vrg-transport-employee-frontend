"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { brDayStartISO, computeLicenseExpiry } from "@/lib/utils/date";

export interface OpenPeriodFormPayload {
  startDate: string;
  licenseValidityMonths: number;
}

interface OpenPeriodModalProps {
  open: boolean;
  loading: boolean;
  serverError: string;
  onClose: () => void;
  onSubmit: (payload: OpenPeriodFormPayload) => Promise<void>;
}

interface FormErrors {
  startDate: string;
  licenseValidityMonths: string;
}

const EMPTY_ERRORS: FormErrors = {
  startDate: "",
  licenseValidityMonths: "",
};

export function OpenPeriodModal({
  open,
  loading,
  serverError,
  onClose,
  onSubmit,
}: OpenPeriodModalProps) {
  const [startDate, setStartDate] = useState("");
  const [licenseValidityMonths, setLicenseValidityMonths] = useState("6");
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  // Reseta o form a cada abertura sem efeito — mesmo padrão dos outros
  // modais deste diretório (comparação com prevOpen).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStartDate("");
      setLicenseValidityMonths("6");
      setErrors(EMPTY_ERRORS);
    }
  }

  const validate = (): OpenPeriodFormPayload | null => {
    const nextErrors: FormErrors = { ...EMPTY_ERRORS };

    if (!startDate) nextErrors.startDate = "Data de início é obrigatória.";

    const months = Number(licenseValidityMonths);
    if (!Number.isInteger(months) || months < 1) {
      nextErrors.licenseValidityMonths = "Validade deve ser maior ou igual a 1 mês.";
    }

    const hasErrors = Object.values(nextErrors).some((value) => value.length > 0);
    setErrors(nextErrors);
    if (hasErrors) return null;

    return {
      startDate: brDayStartISO(startDate),
      licenseValidityMonths: months,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = validate();
    if (!payload) return;
    await onSubmit(payload);
  };

  // Prévia da validade — mesma base do backend: cycleStartDate (aqui, a data
  // de início informada) + meses, calculado em UTC. Aparece antes de criar.
  const monthsNumber = Number(licenseValidityMonths);
  const licenseExpiry =
    startDate && Number.isInteger(monthsNumber) && monthsNumber >= 1
      ? computeLicenseExpiry(brDayStartISO(startDate), monthsNumber)
      : "";

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      title="Abrir novo período de inscrição"
    >
      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="open-period-start-date" className="mb-0.5 block text-sm font-medium text-on-surface">
            Data de início
          </label>
          <input
            id="open-period-start-date"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setErrors((prev) => ({ ...prev, startDate: "" }));
            }}
            className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.startDate && <p className="mt-1 text-xs text-error">{errors.startDate}</p>}
        </div>

        <div>
          <label htmlFor="open-period-validity" className="mb-0.5 block text-sm font-medium text-on-surface">
            Validade da carteirinha (meses)
          </label>
          <input
            id="open-period-validity"
            type="number"
            min={1}
            step={1}
            value={licenseValidityMonths}
            onChange={(event) => {
              setLicenseValidityMonths(event.target.value);
              setErrors((prev) => ({ ...prev, licenseValidityMonths: "" }));
            }}
            className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: 6"
          />
          {errors.licenseValidityMonths ? (
            <p className="mt-1 text-xs text-error">{errors.licenseValidityMonths}</p>
          ) : licenseExpiry ? (
            <p className="mt-1 text-xs text-on-surface-variant">
              Carteirinha válida até{" "}
              <strong className="text-on-surface">{licenseExpiry}</strong>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-on-surface-variant">
              Informe a data de início para ver a validade.
            </p>
          )}
        </div>

        {serverError && (
          <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Abrir período
          </Button>
        </div>
      </form>
    </Modal>
  );
}
