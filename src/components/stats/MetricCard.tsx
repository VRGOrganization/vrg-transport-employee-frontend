"use client";

import React from "react";

type MetricCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  dotColor?: string;
  valueColor?: string;
};

export function MetricCard({
  label,
  value,
  subtitle,
  dotColor,
  valueColor,
}: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-1.5">
      <span className="text-xs text-gray-500 font-normal tracking-wide">
        {label}
      </span>
      <span
        className="text-2xl font-medium leading-none"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
      {subtitle && (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          {dotColor && (
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: dotColor }}
            />
          )}
          {subtitle}
        </span>
      )}
    </div>
  );
}