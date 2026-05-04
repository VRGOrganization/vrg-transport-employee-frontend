interface StatCardProps {
  icon: string;
  label: string;
  value: number | null;
  accent?: "primary" | "success" | "warning" | "error";
}

const accentClasses = {
  primary: {
    icon: "text-primary",
    bg: "bg-primary/10",
  },
  success: {
    icon: "text-success",
    bg: "bg-success/10",
  },
  warning: {
    icon: "text-warning",
    bg: "bg-warning/10",
  },
  error: {
    icon: "text-error",
    bg: "bg-error/10",
  },
};

export function StatCard({ icon, label, value, accent = "primary" }: StatCardProps) {
  const classes = accentClasses[accent];

  return (
    <div className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant rounded-2xl px-5 py-4 flex-1 min-w-0">
      <div className={`p-2.5 rounded-xl shrink-0 ${classes.bg}`}>
        <span
          className={`material-symbols-outlined ${classes.icon}`}
          style={{ fontSize: "22px" }}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-headline font-bold text-on-surface leading-none">
          {value === null ? "—" : value.toLocaleString("pt-BR")}
        </p>
        <p className="text-xs text-on-surface-variant mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}
