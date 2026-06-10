import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Bus } from "@/types/university.types";

interface BusCapacityBadgeProps {
  bus: Bus;
}

/**
 * Indicador compacto de ocupação do ônibus para o header da visão de ônibus.
 * Exibe ocupado/capacidade + pendentes. Capacidade nula/0 = sem limite ("∞").
 * Coloração por % de ocupação: <70% neutro, 70–90% warning, >90% error.
 */
export function BusCapacityBadge({ bus }: BusCapacityBadgeProps) {
  const occupied = bus.filledSlotsTotal ?? 0;
  const capacity = bus.capacity ?? null;
  const pending = bus.pendingCount ?? 0;
  const hasLimit = typeof capacity === "number" && capacity > 0;

  const ratio = hasLimit ? occupied / capacity : 0;
  const colorClass = !hasLimit
    ? "text-on-surface-variant"
    : ratio > 0.9
      ? "text-error"
      : ratio >= 0.7
        ? "text-warning"
        : "text-on-surface-variant";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2">
      <Users className={cn("size-4", colorClass)} />
      <span className={cn("text-sm font-semibold tabular-nums", colorClass)}>
        {occupied}
        {hasLimit ? `/${capacity}` : "/∞"}
      </span>
      <span className="text-xs text-on-surface-variant">
        · {pending} {pending === 1 ? "pendente" : "pendentes"}
      </span>
    </div>
  );
}
