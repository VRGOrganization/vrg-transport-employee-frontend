"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBanner } from "@/components/ui/StatusBanner";

interface BusPassReasonModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  placeholder?: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

/**
 * Negar, devolver e revogar exigem motivo — o texto vai para o aluno. Um
 * `ConfirmModal` não serve porque precisa capturar entrada livre.
 */
export function BusPassReasonModal({
  open,
  title,
  description,
  confirmLabel,
  placeholder = "Explique o motivo para o aluno…",
  loading = false,
  error,
  onClose,
  onConfirm,
}: BusPassReasonModalProps) {
  const [reason, setReason] = useState("");

  // Idioma do repo (ver ConfirmModal): reset em render, sem efeito.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setReason("");
  }

  const trimmed = reason.trim();

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">{description}</p>

        {error ? <StatusBanner variant="error">{error}</StatusBanner> : null}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-on-surface">Motivo</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder={placeholder}
            className="w-full rounded-lg border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => void onConfirm(trimmed)}
            disabled={trimmed.length === 0 || loading}
          >
            {loading ? "…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
