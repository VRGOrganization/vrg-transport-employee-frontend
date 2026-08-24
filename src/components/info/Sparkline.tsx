import { DAYS } from "@/types/info.types";
import { DAY_LABELS } from "@/types/cards.types";

interface SparklineProps {
  /** Cinco valores, SEG..SEX. */
  values: number[];
  width?: number;
  height?: number;
}

/** Fluxo semanal em 5 pontos. SVG inline — sem biblioteca para um traço. */
export function Sparkline({ values, width = 64, height = 20 }: SparklineProps) {
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values
    .map((value, i) => {
      const x = i * step;
      // 1px de respiro nas bordas para o traço não ser cortado.
      const y = height - 1 - (value / max) * (height - 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const label = DAYS.map(
    (day, i) => `${DAY_LABELS[day]}: ${values[i] ?? 0}`,
  ).join(", ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Fluxo semanal de ${label}`}
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}
