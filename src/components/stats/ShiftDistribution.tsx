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
    <div className="flex items-center gap-2.5 mb-2.5">
      <span className="text-xs text-on-surface-muted w-14 text-right shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs text-on-surface-muted w-7 text-right shrink-0">
        {value}
      </span>
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