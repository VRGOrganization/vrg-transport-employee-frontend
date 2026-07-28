"use client";

const MAX_VISIBLE = 8;

interface RankedBreakdownItem {
  id: string;
  label: string;
  count: number;
}

interface RankedBreakdownProps {
  title: string;
  items: RankedBreakdownItem[];
  emptyLabel?: string;
}

export function RankedBreakdown({ title, items, emptyLabel = "Sem dados para os filtros atuais." }: RankedBreakdownProps) {
  const visible = items.slice(0, MAX_VISIBLE);
  const hiddenCount = items.length - visible.length;
  const max = Math.max(...visible.map((i) => i.count), 1);

  return (
    <div>
      <p className="text-xs font-medium text-on-surface-muted mb-3 tracking-wide uppercase">
        {title}
      </p>
      {visible.length === 0 ? (
        <p className="text-sm text-on-surface-muted">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => {
            const pct = max > 0 ? Math.round((item.count / max) * 100) : 0;
            return (
              <div key={item.id}>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-semibold text-on-surface tracking-tight truncate pr-2">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-primary shrink-0">
                    {item.count} <span className="text-xs text-on-surface-muted font-normal">alunos</span>
                  </span>
                </div>
                <div className="h-3 bg-surface-container-high rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <p className="text-xs text-on-surface-muted pt-1">
              +{hiddenCount} {hiddenCount === 1 ? "outro com menos alunos" : "outros com menos alunos"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
