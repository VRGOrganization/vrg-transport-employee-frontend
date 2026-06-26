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
    const maxVal = Math.max(...values, 1); // Avoid 0 max

    const dataLabelsPlugin = {
      id: "dataLabels",
      afterDatasetsDraw(chart: Chart) {
        const { ctx, data } = chart;
        ctx.save();
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        chart.getDatasetMeta(0).data.forEach((bar, index) => {
          const value = data.datasets[0].data[index];
          if (value > 0) {
            ctx.fillText(String(value), bar.x, bar.y - 6);
          }
        });
        ctx.restore();
      },
    };

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
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 25, // space for the text on top
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: { size: 13, weight: "bold" },
            bodyFont: { size: 14 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} alunos`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 12, weight: "bold" },
            },
            border: { display: false }
          },
          y: {
            grid: {
              color: gridColor,
              lineWidth: 1,
            },
            border: { display: false, dash: [4, 4] },
            ticks: {
              color: textColor,
              font: { size: 12 },
              padding: 10,
              stepSize: Math.ceil(maxVal / 5) || 1, // dynamically adjust steps
            },
            min: 0,
            suggestedMax: Math.ceil(maxVal * 1.1),
          },
        },
      },
      plugins: [dataLabelsPlugin],
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