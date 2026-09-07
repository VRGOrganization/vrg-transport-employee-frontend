"use client";

import { Check, CheckCircle2, Plus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/types/audit";
import { actionLabel, eventCategory } from "@/lib/audit";

interface AuditNodeProps {
  event: AuditEvent;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (event: AuditEvent) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Um nó da timeline estilo `git log --graph`: trilho vertical à esquerda com
 * uma bolinha colorida (cor por categoria), e um card à direita. Selecionar
 * NÃO usa checkbox — o card inteiro fica destacado (anel + fundo).
 */
export function AuditNode({
  event,
  selected,
  isFirst,
  isLast,
  onToggleSelect,
  onOpen,
}: AuditNodeProps) {
  const category = eventCategory(event);

  return (
    <div className="flex gap-3">
      {/* Trilho do git graph: linha vertical contínua + nó (bolinha) na altura do card */}
      <div className="relative flex justify-center w-6 shrink-0">
        {/* segmento acima do nó (some no primeiro) */}
        {!isFirst && (
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 h-[1.75rem] w-px bg-outline-variant/60"
            aria-hidden
          />
        )}
        {/* segmento abaixo do nó (some no último) */}
        {!isLast && (
          <span
            className="absolute top-[1.75rem] bottom-0 left-1/2 -translate-x-1/2 w-px bg-outline-variant/60"
            aria-hidden
          />
        )}
        <span
          className={cn(
            "absolute top-[1.4rem] size-3.5 rounded-full ring-4 ring-surface",
            category.dot,
          )}
          aria-hidden
        />
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={() => onOpen(event)}
        onDoubleClick={() => onToggleSelect(event.id)}
        aria-pressed={selected}
        className={cn(
          "group flex-1 text-left rounded-xl p-3 mb-2 ring-1 transition-all cursor-pointer",
          selected
            ? cn("ring-2 bg-primary/5", category.ring)
            : "ring-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                  category.chipBg,
                  category.chipText,
                )}
              >
                {category.label}
              </span>
              <span className="text-sm font-semibold text-on-surface truncate">
                {actionLabel(event.action)}
              </span>
              {event.outcome === "success" ? (
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="size-4 text-error shrink-0" />
              )}
            </div>
            <p className="mt-1 text-xs text-on-surface-variant truncate">
              <span className="font-medium text-on-surface">
                {event.actorName ?? (event.actor ? "Executor não identificado" : "Sistema")}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <time className="text-[11px] text-on-surface-variant tabular-nums">
              {formatTime(event.createdAt)}
            </time>
            <span
              role="button"
              tabIndex={0}
              aria-label={selected ? "Remover seleção" : "Selecionar registro"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(event.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSelect(event.id);
                }
              }}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                selected
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-high text-on-surface ring-1 ring-outline-variant/60 hover:bg-surface-container-highest",
              )}
            >
              {selected ? (
                <>
                  <Check className="size-3.5" />
                  Selecionado
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Selecionar
                </>
              )}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
