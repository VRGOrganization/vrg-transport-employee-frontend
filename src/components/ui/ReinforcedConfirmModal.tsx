"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { StatusBanner } from "./StatusBanner";

interface ReinforcedConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  error?: string;
  title: string;
  description: ReactNode;
  confirmWord: string;
  confirmLabel: string;
  cancelLabel?: string;
}

export function ReinforcedConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  error,
  title,
  description,
  confirmWord,
  confirmLabel,
  cancelLabel = "Cancelar",
}: ReinforcedConfirmModalProps) {
  const [typedWord, setTypedWord] = useState("");
  // Reseta o texto digitado a cada abertura sem efeito — mesmo padrão dos
  // outros modais deste diretório (comparação com prevOpen).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTypedWord("");
  }

  const unlocked = typedWord === confirmWord;

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" hideClose closeOnBackdrop={false}>
      <div className="flex flex-col items-center gap-3 py-4 text-center mb-3">
        <div className="p-4 rounded-full bg-error/10">
          <AlertTriangle className="w-9 h-9 text-error" />
        </div>
        <div className="text-sm text-on-surface-variant max-w-xs">{description}</div>
      </div>

      <div className="mb-4">
        <label htmlFor="reinforced-confirm-word" className="mb-1 block text-sm font-medium text-on-surface">
          Digite {confirmWord} para confirmar
        </label>
        <input
          id="reinforced-confirm-word"
          type="text"
          value={typedWord}
          onChange={(event) => setTypedWord(event.target.value)}
          className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="off"
        />
      </div>

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <button
          disabled={loading || !unlocked}
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
