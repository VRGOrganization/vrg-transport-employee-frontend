"use client";

import { useEffect, useId, useRef } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/types/audit";
import { actionLabel, eventCategory, roleLabel } from "@/lib/audit";
import { downloadAuditEvents } from "@/lib/auditDownload";
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
 * no backdrop são propositalmente ignorados (requisito de UX). Traz botão de
 * baixar o registro no formato escolhido (JSON/PDF/CSV).
 */
export function AuditDetailModal({ event, onClose }: AuditDetailModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!event) return;
    // Trava scroll do body e prende o foco; NÃO registra ESC para fechar.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [event]);

  if (!event) return null;

  const category = eventCategory(event);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      // sem onClick: clicar fora NÃO fecha
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col outline-none"
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn("size-3 rounded-full shrink-0", category.dot)}
              aria-hidden
            />
            <h2
              id={titleId}
              className="font-headline font-semibold text-lg text-on-surface truncate"
            >
              {actionLabel(event.action)}
            </h2>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors ml-2 shrink-0 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 pb-4 flex-1">
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
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-outline-variant/30 shrink-0 flex justify-end">
          <DownloadFormatMenu
            label="Baixar registro"
            onPick={(format) => downloadAuditEvents([event], format)}
          />
        </div>
      </div>
    </div>
  );
}
