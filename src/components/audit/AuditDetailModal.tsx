"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/types/audit";
import { actionLabel, eventCategory, roleLabel } from "@/lib/audit";
import { downloadAuditEvents } from "@/lib/auditDownload";
import { Modal } from "@/components/ui/Modal";
import { DownloadFormatMenu } from "./DownloadFormatMenu";

interface AuditDetailModalProps {
  event: AuditEvent | null;
  onClose: () => void;
}

function fmtDateFull(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-outline-variant/25 last:border-0">
      <span className="text-[11px] uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
      <span className="text-sm text-on-surface break-words">{value}</span>
    </div>
  );
}

/**
 * Detalhe de um registro de auditoria. **Fecha apenas pelo X** — ESC e clique
 * no backdrop são propositalmente ignorados (requisito de UX), o que o modo
 * `dismissible="read-required"` do `Modal` já encapsula.
 */
export function AuditDetailModal({ event, onClose }: AuditDetailModalProps) {
  if (!event) return null;

  const category = eventCategory(event);

  return (
    <Modal
      open
      onClose={onClose}
      dismissible="read-required"
      size="md"
      title={
        <span className="inline-flex items-center gap-2 min-w-0">
          <span
            className={cn("size-3 rounded-full shrink-0", category.dot)}
            aria-hidden
          />
          <span className="truncate">{actionLabel(event.action)}</span>
        </span>
      }
      footer={
        <div className="flex justify-end">
          <DownloadFormatMenu
            label="Baixar registro"
            onPick={(format) => downloadAuditEvents([event], format)}
          />
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
            category.chipBg,
            category.chipText,
          )}
        >
          {category.label}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            event.outcome === "success"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-error",
          )}
        >
          {event.outcome === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {event.outcome === "success" ? "Sucesso" : "Falha"}
        </span>
      </div>

      <Row label="Ação" value={actionLabel(event.action)} />
      <Row label="Data e hora" value={fmtDateFull(event.createdAt)} />
      <Row
        label="Executado por"
        value={
          <>
            {event.actorName ?? "-"}
            {event.actor?.role && (
              <span className="text-on-surface-variant">
                {" "}
                ({roleLabel(event.actor.role)})
              </span>
            )}
          </>
        }
      />
    </Modal>
  );
}
