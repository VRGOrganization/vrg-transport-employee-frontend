"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { computeLicenseExpiry } from "@/lib/utils/date";
import type { EnrollmentPeriod } from "@/types/enrollmentPeriod";

// O ciclo define a validade da carteirinha; as datas pertencem à janela e a
// capacidade é derivada dos ônibus ativos.
export interface EnrollmentCycleFormPayload {
  licenseValidityMonths: number;
}

interface EnrollmentCycleEditModalProps {
  open: boolean;
  period: EnrollmentPeriod;
  loading: boolean;
  serverError: string;
  onClose: () => void;
  onSubmit: (payload: EnrollmentCycleFormPayload) => Promise<void>;
}

export function EnrollmentCycleEditModal({
  open,
  period,
  loading,
  serverError,
  onClose,
  onSubmit,
}: EnrollmentCycleEditModalProps) {
  const initialValidity = String(period.licenseValidityMonths);

  const [validityMonths, setValidityMonths] = useState(initialValidity);
  const [error, setError] = useState("");

  // Reseta o form a cada abertura sem efeito — mesmo padrão dos outros modais
  // deste diretório (comparação com prevOpen).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValidityMonths(initialValidity);
      setError("");
    }
  }

  // Validade sempre ancorada em cycleStartDate (início real do ciclo), nunca
  // na janela — calculada em UTC, igual ao backend.
  const licenseExpiryDate = (() => {
    const months = Number(validityMonths);
    if (!Number.isInteger(months) || months < 1) return "";
    return computeLicenseExpiry(period.cycleStartDate, months);
  })();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const months = Number(validityMonths);
    if (!Number.isInteger(months) || months < 1) {
      setError("Validade deve ser maior ou igual a 1 mês.");
      return;
    }
    if (validityMonths === initialValidity) {
      setError("Nenhuma alteração para salvar.");
      return;
    }

    setError("");
    await onSubmit({ licenseValidityMonths: months });
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="md"
      title="Editar ciclo"
    >
      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="edit-cycle-validity-months"
            className="mb-0.5 block text-sm font-medium text-on-surface"
          >
            Validade da carteirinha (meses)
          </label>
          <input
            id="edit-cycle-validity-months"
            type="number"
            min={1}
            step={1}
            value={validityMonths}
            onChange={(event) => {
              setValidityMonths(event.target.value);
              setError("");
            }}
            className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: 6"
          />
          {licenseExpiryDate && (
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Carteirinhas válidas até{" "}
              <strong className="text-on-surface">{licenseExpiryDate}</strong>{" "}
              (a partir do início do ciclo).
            </p>
          )}
        </div>

        {(error || serverError) && (
          <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {error || serverError}
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
