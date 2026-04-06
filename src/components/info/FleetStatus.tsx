interface FleetItem {
  label: string;
  count: number;
  dotColor: string;
  dimmed?: boolean;
}

const DEFAULT_FLEET: FleetItem[] = [
  { label: "Manhã", count: 3, dotColor: "bg-green-500", dimmed: false },
  { label: "Tarde", count: 7, dotColor: "bg-amber-500", dimmed: true },
];

interface FleetStatusProps {
  items?: FleetItem[];
}

export function FleetStatus({ items = DEFAULT_FLEET }: FleetStatusProps) {
  return (
    <div className="bg-surface-container-high dark:bg-slate-800/50 p-6 rounded-xl space-y-4">
      <h2 className="text-lg font-bold font-headline text-primary flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
          directions_bus
        </span>
        Status da Frota
      </h2>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className= "flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg transition-opacity "
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${item.dotColor}`} />
              <span className="text-sm font-semibold text-on-surface">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-on-surface">
              {item.count} Ônibus
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}