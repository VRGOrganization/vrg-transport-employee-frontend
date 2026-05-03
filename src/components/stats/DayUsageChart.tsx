"use client";

import React, { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const textColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";
    const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

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
              v === maxVal ? "#185FA5" : "#378ADD"
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
  }, [byDay]);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-400 mb-4 tracking-wide uppercase">
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