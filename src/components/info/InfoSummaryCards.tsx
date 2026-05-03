interface SummaryCard {
  icon: string;
  label: string;
  value: string | number;
  accent?: "primary" | "blue" | "indigo" | "secondary";
  badge?: string;
  badgeColor?: string;
  progressPercent?: number;
  progressColor?: string;
  pulse?: boolean;
}

const accentMap = {
  primary: "border-primary",
  blue: "",
  indigo: "",
  secondary: "border-secondary",
};

const iconBgMap = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  secondary: "bg-secondary/10 text-secondary",
};

const valueColorMap = {
  primary: "text-primary",
  blue: "text-slate-800 dark:text-slate-100",
  indigo: "text-slate-800 dark:text-slate-100",
  secondary: "text-secondary",
};

function InfoCard({ card }: { card: SummaryCard }) {
  const accent = card.accent ?? "primary";
  const hasBorder = accent === "primary" || accent === "secondary";

  return (
    <div
      className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:-translate-y-0.5 transition-transform duration-300 ${
        hasBorder ? `border-l-4 ${accentMap[accent]}` : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${iconBgMap[accent]}`}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
            {card.icon}
          </span>
        </div>
        {card.badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${card.badgeColor}`}>
            {card.badge}
          </span>
        )}
        {card.pulse && (
          <span className="flex h-3 w-3 relative mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-on-surface-variant">{card.label}</p>
      <h3 className={`text-3xl font-extrabold font-headline ${valueColorMap[accent]}`}>
        {typeof card.value === "number" ? card.value.toLocaleString("pt-BR") : card.value}
      </h3>

      {card.progressPercent !== undefined && (
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className={`h-full rounded-full ${card.progressColor}`}
            style={{ width: `${card.progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface InfoSummaryCardsProps {
  totalStudents: number;
  dayStudents: number;
  nightStudents: number;
  pendingRequests: number;
  loading?: boolean;
}

export function InfoSummaryCards({
  totalStudents,
  dayStudents,
  nightStudents,
  pendingRequests,
  loading = false,
}: InfoSummaryCardsProps) {
  const dayPercent = totalStudents > 0 ? Math.round((dayStudents / totalStudents) * 100) : 0;
  const nightPercent = 100 - dayPercent;

  const cards: SummaryCard[] = [
    {
      icon: "school",
      label: "Total de Alunos",
      value: totalStudents,
      accent: "primary",
      badgeColor: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      icon: "light_mode",
      label: "Alunos Diurnos",
      value: dayStudents,
      
      progressPercent: dayPercent,
      progressColor: "bg-blue-500",
    },
    {
      icon: "dark_mode",
      label: "Alunos Noturnos",
      value: nightStudents,
      progressPercent: nightPercent,
      progressColor: "bg-indigo-600",
    },
    {
      icon: "pending_actions",
      label: "Solicitações Pendentes",
      value: pendingRequests,
      accent: "secondary",
      pulse: true,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-xl animate-pulse h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <InfoCard key={i} card={card} />
      ))}
    </div>
  );
}