interface SubInfo {
  text: string;
  positive: boolean;
  warning?: boolean;
}

type Accent = "primary" | "secondary" | "tertiary";

interface DashboardStatCardProps {
  icon: string;
  label: string;
  value: number | string | null;
  badge?: string;
  accent?: Accent;
  subInfo?: SubInfo;
}

const accentStyles: Record<Accent, { icon: string; badge: string }> = {
  primary: {
    icon: "text-primary",
    badge: "bg-primary/10 text-primary",
  },
  secondary: {
    icon: "text-secondary",
    badge: "bg-secondary/10 text-secondary",
  },
  tertiary: {
    icon: "text-tertiary",
    badge: "bg-tertiary/10 text-tertiary",
  },
};

export function DashboardStatCard({
  icon,
  label,
  value,
  badge,
  accent = "primary",
  subInfo,
}: DashboardStatCardProps) {
  const displayValue =
    typeof value === "number"
      ? value.toLocaleString("pt-BR")
      : value === null
        ? "—"
        : value;

  const subInfoColor = subInfo?.warning
    ? "text-amber-500"
    : subInfo?.positive
      ? "text-emerald-600"
      : "text-on-surface-variant";

  const subInfoIcon = subInfo?.warning
    ? "warning"
    : subInfo?.positive
      ? "trending_up"
      : null;

  const accentStyle = accentStyles[accent];

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      {/* Top row: icon + status badge */}
      <div className="flex items-start justify-between mb-4">
        <span className={`material-symbols-outlined ${accentStyle.icon}`} style={{ fontSize: "22px" }}>
          {icon}
        </span>
        {badge ? (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${accentStyle.badge}`}>
            {badge}
          </span>
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant/40" style={{ fontSize: "18px" }}>
            arrow_outward
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-3xl font-extrabold text-on-surface tracking-tight leading-none mb-1">
        {displayValue}
      </p>

      {/* Label */}
      <p className="text-sm text-on-surface-variant mb-3">{label}</p>

      {/* SubInfo */}
      {subInfo && (
        <p className={`text-xs font-medium flex items-center gap-1 ${subInfoColor}`}>
          {subInfoIcon && (
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              {subInfoIcon}
            </span>
          )}
          {subInfo.text}
        </p>
      )}
    </div>
  );
}
