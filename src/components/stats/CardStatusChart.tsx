"use client";

import React, { useEffect, useRef } from "react";
import {
  Chart,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

type CardStatusChartProps = {
  withCard: number;
  pending: number;
  withoutCard: number;
};

const COLORS = {
  withCard: "#639922",
  pending: "#EF9F27",
  withoutCard: "#E24B4A",
};

export function CardStatusChart({
  withCard,
  pending,
  withoutCard,
}: CardStatusChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Emitida", "Pendente", "Sem solicitação"],
        datasets: [
          {
            data: [withCard, pending, withoutCard],
            backgroundColor: [
              COLORS.withCard,
              COLORS.pending,
              COLORS.withoutCard,
            ],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [withCard, pending, withoutCard]);

  const total = withCard + pending + withoutCard;
  const pct = (n: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
      <p className="text-xs font-medium text-on-surface-muted mb-4 tracking-wide uppercase">
        Status das carteirinhas
      </p>

      <div className="relative h-44">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Gráfico de status: ${withCard} emitidas, ${pending} pendentes, ${withoutCard} sem solicitação`}
        >
          Emitida: {withCard}, Pendente: {pending}, Sem solicitação:{" "}
          {withoutCard}.
        </canvas>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
        {[
          { label: "Emitida", value: withCard, color: COLORS.withCard },
          { label: "Pendente", value: pending, color: COLORS.pending },
          {
            label: "Sem solicitação",
            value: withoutCard,
            color: COLORS.withoutCard,
          },
        ].map(({ label, value, color }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant"
          >
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: color }}
            />
            {label} {pct(value)}
          </span>
        ))}
      </div>
    </div>
  );
}