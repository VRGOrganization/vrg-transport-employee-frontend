import type { AllocationEntry } from "@/types/cards.types";

interface AllocationSummaryCardProps {
  allocations: AllocationEntry[];
  transportMode?: "regular" | "weekly" | null;
}

const DAY_LABELS: Record<string, string> = {
  SEG: "Seg",
  TER: "Ter",
  QUA: "Qua",
  QUI: "Qui",
  SEX: "Sex",
};

const PERIOD_LABELS: Record<string, string> = {
  "Manhã": "Manhã",
  "Tarde": "Tarde",
  "Noite": "Noite",
};

const STATUS_STYLES: Record<
  AllocationEntry["status"],
  { bg: string; text: string; label: string }
> = {
  active: {
    bg: "bg-success/10",
    text: "text-success",
    label: "Alocado",
  },
  waitlisted: {
    bg: "bg-warning-container",
    text: "text-on-warning",
    label: "Na fila",
  },
  cancelled: {
    bg: "bg-outline-variant/20",
    text: "text-on-surface-variant",
    label: "Cancelado",
  },
};

export function AllocationSummaryCard({
  allocations,
  transportMode,
}: AllocationSummaryCardProps) {
  if (!allocations || allocations.length === 0) return null;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 space-y-2">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Alocação de Ônibus
        </p>
        {transportMode && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {transportMode === "weekly" ? "Semanal" : "Regular"}
          </span>
        )}
      </div>

      {/* Tabela de alocações */}
      <div className="space-y-1.5">
        {allocations.map((entry, i) => {
          const style = STATUS_STYLES[entry.status] ?? STATUS_STYLES.cancelled;
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${style.bg}`}
            >
              {/* Dia + Período */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface w-8">
                  {DAY_LABELS[entry.day] ?? entry.day}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {PERIOD_LABELS[entry.period] ?? entry.period}
                </span>
                {/* Ida / Volta */}
                <div className="flex gap-1">
                  {entry.needsOutbound && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      Ida
                    </span>
                  )}
                  {entry.needsReturn && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">
                      Volta
                    </span>
                  )}
                </div>
              </div>

              {/* Ônibus + Status */}
              <div className="flex items-center gap-2">
                {entry.busIdentifier && (
                  <span className="text-xs text-on-surface-variant font-mono">
                    #{entry.busIdentifier}
                  </span>
                )}
                <span className={`text-[10px] font-semibold ${style.text}`}>
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
