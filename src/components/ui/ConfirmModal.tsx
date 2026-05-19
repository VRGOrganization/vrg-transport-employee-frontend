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
    <Modal open={open} onClose={onClose} title={title} size="sm" hideClose>
      <div className="flex flex-col items-center gap-3 py-4 text-center mb-5">
        <div className={`p-4 rounded-full ${s.bg}`}>
          <Icon className={`w-9 h-9 ${s.icon}`} />
        </div>
        <div className="text-sm text-on-surface-variant max-w-xs">{description}</div>
      </div>

      {error && <StatusBanner variant="error" className="mb-4">{error}</StatusBanner>}

      <div className="flex gap-3">
        <Button variant="outline" size="sm" fullWidth onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <button
          disabled={loading}
          onClick={onConfirm}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${s.btn}`}
        >
          {loading ? "…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
