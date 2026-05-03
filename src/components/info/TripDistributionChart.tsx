interface DayData {
  label: string;
  total: number;
  day: number;
  night: number;
}

const DEFAULT_DATA: DayData[] = [
  { label: "Segunda-feira", total: 940, day: 612, night: 328 },
  { label: "Terça-feira", total: 892, day: 535, night: 357 },
  { label: "Quarta-feira", total: 956, day: 650, night: 306 },
  { label: "Quinta-feira", total: 870, day: 540, night: 330 },
  { label: "Sexta-feira", total: 780, day: 429, night: 351 },
];

interface TripBarProps {
  data: DayData;
}

function TripBar({ data }: TripBarProps) {
  const dayPercent = Math.round((data.day / data.total) * 100);
  const nightPercent = 100 - dayPercent;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>{data.label}</span>
        <span>{data.total.toLocaleString("pt-BR")} passageiros</span>
      </div>
      <div className="flex h-10 gap-0.5 overflow-hidden rounded-lg">
        <div
          className="bg-blue-500 hover:brightness-110 transition-all flex items-center justify-center text-[10px] text-white font-bold rounded-l-lg"
          style={{ width: `${dayPercent}%` }}
        >
          {data.day}
        </div>
        <div
          className="bg-indigo-800 hover:brightness-110 transition-all flex items-center justify-center text-[10px] text-white font-bold rounded-r-lg"
          style={{ width: `${nightPercent}%` }}
        >
          {data.night}
        </div>
      </div>
    </div>
  );
}

interface TripDistributionChartProps {
  data?: DayData[];
}

export function TripDistributionChart({ data = DEFAULT_DATA }: TripDistributionChartProps) {
  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold font-headline text-primary">Distribuição de Viagens</h2>
          <p className="text-sm text-on-surface-variant">Frequência semanal por turno</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Diurno</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-800 rounded-full" />
            <span>Noturno</span>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-6">
        {data.map((day) => (
          <TripBar key={day.label} data={day} />
        ))}
      </div>
    </div>
  );
}