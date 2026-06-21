interface PriorityBadgeProps {
  level: number | null | undefined;
  ruleName?: string | null;
}

const LEVEL_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-error/10",            text: "text-error",              label: "Prioridade 1" },
  2: { bg: "bg-warning/15",          text: "text-warning",            label: "Prioridade 2" },
  3: { bg: "bg-primary/10",          text: "text-primary",            label: "Prioridade 3" },
  4: { bg: "bg-secondary/10",        text: "text-secondary",          label: "Prioridade 4" },
  5: { bg: "bg-outline-variant/20",  text: "text-on-surface-variant", label: "Prioridade 5" },
};

export function PriorityBadge({ level, ruleName }: PriorityBadgeProps) {
  if (!level) return null;

  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[5];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${style.bg}`}>
      <span className={`text-xs font-bold ${style.text}`}>{style.label}</span>
      {ruleName && (
        <span className={`text-[10px] ${style.text} opacity-70`}>· {ruleName}</span>
      )}
    </div>
  );
}
