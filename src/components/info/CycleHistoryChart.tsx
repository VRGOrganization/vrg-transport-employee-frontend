"use client";

import { useEffect, useRef } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js";
import type { CycleSummary } from "@/types/info.types";
import { useIsDark } from "@/hooks/ui/useTheme";
import { formatDateBR } from "@/lib/info/format";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

interface CycleHistoryChartProps {
  cycles: CycleSummary[];
  selectedCycleId: string | null;
  onSelectCycle: (cycleId: string) => void;
}

/** Carteirinhas emitidas por ciclo; o selecionado em destaque. */
export function CycleHistoryChart({
  cycles,
  selectedCycleId,
  onSelectCycle,
}: CycleHistoryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const isDark = useIsDark();

  // Callback em ref: trocar o handler não deve recriar o gráfico.
  const onSelectRef = useRef(onSelectCycle);
  onSelectRef.current = onSelectCycle;

  // Ordem cronológica (o seletor lista do mais recente para o mais antigo).
  const ordered = [...cycles].reverse();

  useEffect(() => {
    if (!canvasRef.current || ordered.length === 0) return;

    const cssVar = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const textColor = cssVar("--color-on-surface-muted");
    const gridColor = cssVar("--color-outline-variant");
    const highlight = cssVar("--color-primary");
    const muted = cssVar("--color-outline-variant");

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: ordered.map((cycle) => formatDateBR(cycle.cycleStartDate)),
        datasets: [
          {
            label: "Carteirinhas",
            data: ordered.map((cycle) => cycle.licenses),
            backgroundColor: ordered.map((cycle) =>
              cycle.cycleId === selectedCycleId ? highlight : muted,
            ),
            borderRadius: 3,
            borderSkipped: false,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_event, elements) => {
          const index = elements[0]?.index;
          if (index !== undefined) onSelectRef.current(ordered[index].cycleId);
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` ${(ctx.parsed.y ?? 0).toLocaleString("pt-BR")} carteirinhas`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: textColor, font: { size: 10 } },
          },
          y: {
            grid: { color: gridColor },
            border: { display: false },
            ticks: { color: textColor, font: { size: 10 }, precision: 0 },
            min: 0,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // `ordered` é derivado de `cycles` a cada render; a dependência real é a
    // lista de ciclos, o ciclo selecionado e o tema.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycles, selectedCycleId, isDark]);

  if (ordered.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-on-surface-muted">
        Sem histórico de ciclos.
      </p>
    );
  }

  return (
    <div className="relative h-32">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Carteirinhas emitidas por ciclo: ${ordered
          .map(
            (cycle) =>
              `${formatDateBR(cycle.cycleStartDate)}: ${cycle.licenses}`,
          )
          .join(", ")}`}
      />
    </div>
  );
}
