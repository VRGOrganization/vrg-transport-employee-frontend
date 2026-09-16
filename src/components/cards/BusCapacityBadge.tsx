"use client";

import { useState } from "react";
import { Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusCapacityBadgeProps {
  /** Alunos aprovados (com carteirinha ativa) neste ônibus. */
  approved: number;
  /** Capacidade do ônibus. Null/0 = sem limite ("∞"). */
  capacity: number | null;
  /** Alunos pendentes de aprovação. */
  pending: number;
  /** Alunos na fila de espera. */
  waitlisted: number;
  /** Alunos com solicitação de atualização pendente (revisão). */
  review: number;
}

/**
 * Indicador de ocupação do ônibus. À primeira vista exibe apenas Aprovados /
 * capacidade. Um botão com seta revela o detalhamento das demais listas
 * (pendentes, em espera, revisão) e o total de alunos no ônibus.
 * Coloração por % de ocupação: <70% neutro, 70–90% warning, >90% error.
 */
export function BusCapacityBadge({
  approved,
  capacity,
  pending,
  waitlisted,
  review,
}: BusCapacityBadgeProps) {
  const [open, setOpen] = useState(false);

  const hasLimit = typeof capacity === "number" && capacity > 0;
  const ratio = hasLimit ? approved / capacity : 0;
  const colorClass = !hasLimit
    ? "text-on-surface-variant"
    : ratio > 0.9
      ? "text-error"
      : ratio >= 0.7
        ? "text-warning"
        : "text-on-surface-variant";

  const total = approved + pending + waitlisted + review;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Detalhar ocupação do ônibus"
        aria-expanded={open}
        title="Ver detalhamento de alunos"
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-xl border bg-surface-container-lowest px-3 py-2 transition-colors",
          open
            ? "border-primary"
            : "border-outline-variant hover:bg-surface-container-low",
        )}
      >
        <Users className={cn("size-4", colorClass)} />
        <span className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {approved}
          {hasLimit ? `/${capacity}` : "/∞"}
        </span>
        <span className="mx-0.5 h-4 w-px bg-outline-variant" aria-hidden />
        <ChevronDown
          className={cn(
            "size-4 text-on-surface-variant transition-transform duration-200",
            open ? "rotate-0" : "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-64 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Detalhamento de alunos
          </p>

          <ul className="space-y-1.5">
            <StatRow
              label="Pendentes de aprovação"
              value={pending}
              dotClass="bg-warning"
            />
            <StatRow label="Em espera" value={waitlisted} dotClass="bg-primary" />
            <StatRow
              label="Pendentes de revisão"
              value={review}
              dotClass="bg-tertiary"
            />
          </ul>

          <div className="mt-2.5 flex items-center justify-between border-t border-outline-variant pt-2.5">
            <span className="text-sm font-semibold text-on-surface">
              Total de alunos
            </span>
            <span className="text-sm font-bold tabular-nums text-on-surface">
              {total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-sm text-on-surface-variant">
        <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-on-surface">
        {value}
      </span>
    </li>
  );
}
