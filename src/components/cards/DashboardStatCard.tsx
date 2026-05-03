interface SubInfo {
  text: string;
  positive: boolean;
  warning?: boolean;
}

interface DashboardStatCardProps {
  icon: string;
  label: string;
  value: number | string | null;
  subInfo?: SubInfo;
}

export function DashboardStatCard({
  icon,
  label,
  value,
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

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      {/* Top row: icon + arrow */}
      <div className="flex items-start justify-between mb-4">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "22px" }}>
          {icon}
        </span>
        <span className="material-symbols-outlined text-on-surface-variant/40" style={{ fontSize: "18px" }}>
          arrow_outward
        </span>
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