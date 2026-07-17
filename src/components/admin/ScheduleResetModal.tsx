"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ScheduleResetModalProps {
  open: boolean;
  loading: boolean;
  serverError: string;
  onClose: () => void;
  onSubmit: (days: number) => Promise<void>;
}

export function ScheduleResetModal({
  open,
  loading,
  serverError,
  onClose,
  onSubmit,
}: ScheduleResetModalProps) {
  const [daysText, setDaysText] = useState("");
  const [fieldError, setFieldError] = useState("");
  // Reseta o form a cada abertura sem efeito — ajuste de estado durante o
  // render, guardado pela comparação com prevOpen (padrão recomendado pelo
  // React pra "resetar estado quando uma prop muda").
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDaysText("");
      setFieldError("");
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const days = Number(daysText);
    if (!Number.isInteger(days) || days < 1) {
      setFieldError("Informe um número inteiro de dias, no mínimo 1.");
      return;
    }
    setFieldError("");
    await onSubmit(days);
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      title="Encerrar em X dias"
    >
      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="schedule-reset-days" className="mb-1 block text-sm font-medium text-on-surface">
            Quantos dias a partir de agora?
          </label>
          <input
            id="schedule-reset-days"
            type="number"
            min={1}
            step={1}
            value={daysText}
            onChange={(event) => {
              setDaysText(event.target.value);
              setFieldError("");
            }}
            className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: 3"
          />
          {fieldError && <p className="mt-1 text-xs text-error">{fieldError}</p>}
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
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
