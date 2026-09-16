"use client";

import { useId, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Modal, type Dismissible } from "./Modal";
import { Button } from "./Button";
import { StatusBanner } from "./StatusBanner";
import { Spinner } from "./Spinner";

export type ConfirmationSpec =
  | { kind: "checkbox"; label: string }
  | { kind: "type-word"; word: string }
  | { kind: "type-identifier"; identifier: string; label: string };

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  error?: string;
  title: string;
  description: ReactNode;
  icon: LucideIcon;
  variant: "danger" | "success" | "warning";
  cancelLabel?: string;
  confirmLabel: string;
  /** Only consulted when `confirmation` is omitted — with it, dismiss is always forced to "confirm-only". */
  dismissible?: Dismissible;
  /** Extra friction gate before the confirm button unlocks, for destructive/irreversible actions. */
  confirmation?: ConfirmationSpec;
}

const VARIANT_STYLES = {
  danger:  { bg: "bg-error/10",   icon: "text-error",   btn: "bg-error text-white hover:bg-error/90"             },
  success: { bg: "bg-success/10", icon: "text-success", btn: "bg-success text-white hover:bg-success/90"         },
  warning: { bg: "bg-warning/10", icon: "text-warning", btn: "bg-warning text-on-warning hover:bg-warning/90"   },
} as const;

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  error,
  title,
  description,
  icon: Icon,
  variant,
  cancelLabel = "Cancelar",
  confirmLabel,
  dismissible,
  confirmation,
}: ConfirmModalProps) {
  const s = VARIANT_STYLES[variant];
  const checkboxId = useId();
  const wordInputId = useId();
  const identifierInputId = useId();

  const [checked, setChecked] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  // Reseta o estado da confirmação a cada abertura sem efeito — mesmo padrão
  // já usado pelos modais que este componente substitui (comparação com prevOpen).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setChecked(false);
      setTypedValue("");
    }
  }

  const confirmationUnlocked =
    !confirmation ||
    (confirmation.kind === "checkbox" && checked) ||
    (confirmation.kind === "type-word" && typedValue === confirmation.word) ||
    (confirmation.kind === "type-identifier" && typedValue === confirmation.identifier);

  const canConfirm = !loading && confirmationUnlocked;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      hideClose
      closeOnBackdrop={false}
      dismissible={confirmation ? "confirm-only" : dismissible}
    >
      <div className="flex flex-col items-center gap-3 py-4 text-center mb-5">
        <div className={`p-4 rounded-full ${s.bg}`}>
          <Icon className={`w-9 h-9 ${s.icon}`} />
        </div>
        <div className="text-sm text-on-surface-variant max-w-xs">{description}</div>
      </div>

      {confirmation?.kind === "checkbox" && (
        <label
          htmlFor={checkboxId}
          className="mb-4 flex cursor-pointer items-start gap-2 rounded-lg border border-error/40 bg-error/5 p-3"
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-error"
          />
          <span className="text-sm text-on-surface">{confirmation.label}</span>
        </label>
      )}

      {confirmation?.kind === "type-word" && (
        <div className="mb-4">
          <label htmlFor={wordInputId} className="mb-1 block text-sm font-medium text-on-surface">
            Digite {confirmation.word} para confirmar
          </label>
          <input
            id={wordInputId}
            type="text"
            value={typedValue}
            onChange={(event) => setTypedValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
          />
        </div>
      )}

      {confirmation?.kind === "type-identifier" && (
        <div className="mb-4 space-y-1.5 text-left">
          <label htmlFor={identifierInputId} className="text-xs font-semibold text-on-surface-variant">
            {confirmation.label} <span className="text-error">*</span>
          </label>
          <p className="text-[11px] text-on-surface-variant">
            Digite exatamente:{" "}
            <span className="font-bold text-on-surface select-all">{confirmation.identifier}</span>
          </p>
          <input
            id={identifierInputId}
            type="text"
            value={typedValue}
            onChange={(event) => setTypedValue(event.target.value)}
            placeholder={confirmation.identifier}
            autoComplete="off"
            className="w-full px-3 py-2.5 rounded-lg bg-surface-container border-2 border-error text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-error transition-all"
          />
        </div>
      )}

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <button
          disabled={!canConfirm}
          onClick={onConfirm}
          className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${s.btn}`}
        >
          {loading && <Spinner size="sm" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
