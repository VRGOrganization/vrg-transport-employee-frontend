"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { DayUsageStats } from "@/types/student-stats";

Chart.register(
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip
);

type DayUsageChartProps = {
  byDay: DayUsageStats;
};

const DAY_LABELS: Record<keyof DayUsageStats, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
};

export function DayUsageChart({ byDay }: DayUsageChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const cssVar = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const textColor = cssVar("--color-on-surface-muted");
    const gridColor = cssVar("--color-outline-variant");
    const barPrimary = cssVar("--color-primary");
    const barSecondary = cssVar("--color-primary-fixed-dim");

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const days: (keyof DayUsageStats)[] = ["SEG", "TER", "QUA", "QUI", "SEX"];
    const values = days.map((d) => byDay[d]);
    const maxVal = Math.max(...values);

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: days.map((d) => DAY_LABELS[d]),
        datasets: [
          {
            label: "Alunos",
            data: values,
            backgroundColor: values.map((v) =>
              v === maxVal ? barPrimary : barSecondary
            ),
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} alunos`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 12 },
              autoSkip: false,
              maxRotation: 0,
            },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 12 },
              stepSize: 20,
            },
            min: 0,
            suggestedMax: Math.ceil(maxVal * 1.2),
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [byDay, isDark]);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5">
      <p className="text-xs font-medium text-on-surface-muted mb-4 tracking-wide uppercase">
        Uso por dia da semana
      </p>
      <div className="relative h-44">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Gráfico de uso do transporte por dia da semana"
        >
          {Object.entries(byDay)
            .map(([d, v]) => `${DAY_LABELS[d as keyof DayUsageStats]}: ${v}`)
            .join(", ")}
        </canvas>
      </div>
    </div>
  );
}