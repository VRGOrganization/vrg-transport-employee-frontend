"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { StatusBanner } from "./StatusBanner";

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
}: ConfirmModalProps) {
  const s = VARIANT_STYLES[variant];

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" hideClose closeOnBackdrop={false}>
      <div className="flex flex-col items-center gap-3 py-4 text-center mb-5">
        <div className={`p-4 rounded-full ${s.bg}`}>
          <Icon className={`w-9 h-9 ${s.icon}`} />
        </div>
        <div className="text-sm text-on-surface-variant max-w-xs">{description}</div>
      </div>

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <button
          disabled={loading}
          onClick={onConfirm}
          className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${s.btn}`}
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
