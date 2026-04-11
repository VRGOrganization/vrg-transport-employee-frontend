interface DashboardStatCardProps {
  icon: string;
  label: string;
  value: number | null;
  badge: string;
  accent: "primary" | "secondary" | "tertiary";
}

const accentMap = {
  primary: {
    border: "border-primary",
    icon: "text-primary",
    badge: "text-primary bg-primary-fixed",
    value: "text-primary",
  },
  secondary: {
    border: "border-secondary",
    icon: "text-secondary",
    badge: "text-on-secondary-container bg-secondary-fixed",
    value: "text-secondary",
  },
  tertiary: {
    border: "border-on-primary-fixed-variant",
    icon: "text-on-primary-fixed-variant",
    badge: "text-on-primary-fixed-variant bg-tertiary-fixed",
    value: "text-on-primary-fixed-variant",
  },
};




export function DashboardStatCard({
  icon,
  label,
  value,
  badge,
  accent,
}: DashboardStatCardProps) {
  const c = accentMap[accent];
  return (
    <div
      className={`bg-surface-container-lowest p-6 rounded-xl border-l-4 ${c.border} shadow-sm hover:-translate-y-1 transition-transform duration-300`}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`material-symbols-outlined ${c.icon} text-3xl`}>
          {icon}
        </span>
        <span className={`text-xs font-bold ${c.badge} px-2 py-1 rounded`}>
          {badge}
        </span>
      </div>
      <p className="text-on-surface-variant text-sm font-medium mb-1">
        {label}
      </p>
      <h3 className={`font-headline text-3xl font-extrabold ${c.value}`}>
        {value === null ? "—" : value.toLocaleString("pt-BR")}
      </h3>
    </div>
  );
}


