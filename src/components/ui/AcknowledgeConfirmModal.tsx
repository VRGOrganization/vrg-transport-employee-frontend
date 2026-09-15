"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { StatusBanner } from "./StatusBanner";

interface AcknowledgeConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  error?: string;
  title: string;
  description: ReactNode;
  /** Texto do checkbox — deve dizer o que o admin está aceitando perder. */
  acknowledgeLabel: string;
  confirmLabel: string;
  cancelLabel?: string;
}

/**
 * Irmão do ReinforcedConfirmModal para ações destrutivas cuja consequência
 * precisa ser lida e aceita, e não decorada: em vez de digitar uma palavra, o
 * admin marca um checkbox que declara o que vai acontecer.
 */
export function AcknowledgeConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  error,
  title,
  description,
  acknowledgeLabel,
  confirmLabel,
  cancelLabel = "Cancelar",
}: AcknowledgeConfirmModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  // Reseta a ciência a cada abertura sem efeito — mesmo padrão dos outros
  // modais deste diretório (comparação com prevOpen). Sem isso, reabrir o
  // modal deixaria a ação destrutiva a um clique de distância.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setAcknowledged(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" hideClose closeOnBackdrop={false}>
      <div className="flex flex-col items-center gap-3 py-4 text-center mb-3">
        <div className="p-4 rounded-full bg-error/10">
          <AlertTriangle className="w-9 h-9 text-error" />
        </div>
        <div className="text-sm text-on-surface-variant">{description}</div>
      </div>

      <label
        htmlFor="acknowledge-confirm"
        className="mb-4 flex cursor-pointer items-start gap-2 rounded-lg border border-error/40 bg-error/5 p-3"
      >
        <input
          id="acknowledge-confirm"
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-error"
        />
        <span className="text-sm text-on-surface">{acknowledgeLabel}</span>
      </label>

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <button
          disabled={loading || !acknowledged}
          onClick={onConfirm}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-error px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading && (
            <svg className="size-4 shrink-0 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
