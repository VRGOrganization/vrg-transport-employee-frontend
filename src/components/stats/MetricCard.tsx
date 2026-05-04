"use client";

import React from "react";

type AccentColor = "success" | "warning" | "error" | "info";

const colorMap: Record<AccentColor, { dot: string; value: string }> = {
  success: { dot: "bg-success", value: "text-success" },
  warning: { dot: "bg-warning", value: "text-warning" },
  error:   { dot: "bg-error",   value: "text-error" },
  info:    { dot: "bg-info",    value: "text-info" },
};

type MetricCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  accentColor?: AccentColor;
};

export function MetricCard({ label, value, subtitle, accentColor }: MetricCardProps) {
  const colors = accentColor ? colorMap[accentColor] : null;

  return (
    <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-1.5">
      <span className="text-xs text-on-surface-variant font-normal tracking-wide">
        {label}
      </span>
      <span className={`text-2xl font-medium leading-none ${colors?.value ?? "text-on-surface"}`}>
        {value}
      </span>
      {subtitle && (
        <span className="text-xs text-on-surface-muted flex items-center gap-1">
          {colors && (
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
          )}
          {subtitle}
        </span>
      )}
    </div>
  );
}
