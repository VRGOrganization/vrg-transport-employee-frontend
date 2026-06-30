"use client";

import React from "react";

type ShiftBarProps = {
  label: string;
  value: number;
  max: number;
  color: string;
};

function ShiftBar({ label, value, max, color }: ShiftBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-sm font-semibold text-on-surface tracking-tight">
          {label}
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {value} <span className="text-xs text-on-surface-muted font-normal">alunos</span>
        </span>
      </div>
      <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden relative shadow-inner">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ 
            width: `${pct}%`, 
            background: `linear-gradient(90deg, ${color}DD, ${color})`
          }}
        />
      </div>
    </div>
  );
}

type ShiftDistributionProps = {
  morning: number;
  afternoon: number;
  night: number;
  fullTime: number;
};

export function ShiftDistribution({
  morning,
  afternoon,
  night,
  fullTime,
}: ShiftDistributionProps) {
  const max = Math.max(morning, afternoon, night, fullTime, 1);

  return (
    <div>
      <p className="text-xs font-medium text-on-surface-muted mb-3 tracking-wide uppercase">
        Distribuição por turno
      </p>
      <ShiftBar label="Manhã" value={morning} max={max} color="#378ADD" />
      <ShiftBar label="Tarde" value={afternoon} max={max} color="#1D9E75" />
      <ShiftBar label="Noite" value={night} max={max} color="#7F77DD" />
      <ShiftBar label="Integral" value={fullTime} max={max} color="#D4537E" />
    </div>
  );
}