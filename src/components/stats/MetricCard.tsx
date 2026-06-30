"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Users, Activity } from "lucide-react";

type AccentColor = "success" | "warning" | "error" | "info";

const colorMap: Record<AccentColor, { dot: string; value: string; bg: string; border: string; icon: React.ReactNode }> = {
  success: { dot: "bg-success", value: "text-success", bg: "bg-success-container/30", border: "border-success/20", icon: <CheckCircle2 className="w-5 h-5 text-success" /> },
  warning: { dot: "bg-warning", value: "text-warning", bg: "bg-warning-container/30", border: "border-warning/20", icon: <AlertTriangle className="w-5 h-5 text-warning" /> },
  error:   { dot: "bg-error",   value: "text-error", bg: "bg-error-container/30", border: "border-error/20", icon: <XCircle className="w-5 h-5 text-error" /> },
  info:    { dot: "bg-info",    value: "text-info", bg: "bg-info-container/30", border: "border-info/20", icon: <Activity className="w-5 h-5 text-info" /> },
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
    <div className={`relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover border ${colors ? colors.border : "border-outline-variant/30"} bg-surface-container-low/80 backdrop-blur-md`}>
      {/* Background subtle gradient for modern feel */}
      <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full opacity-20 blur-2xl ${colors ? colors.dot : "bg-primary"}`} />

      <div className="flex items-center justify-between">
        <span className="text-sm text-on-surface-variant font-medium tracking-wide">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${colors ? colors.bg : "bg-primary-container/20"} shadow-sm`}>
          {colors ? colors.icon : <Users className="w-5 h-5 text-primary" />}
        </div>
      </div>
      
      <div className="flex flex-col gap-1 z-10 mt-1">
        <span className={`text-3xl font-semibold tracking-tight ${colors?.value ?? "text-on-surface"}`}>
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-on-surface-muted flex items-center gap-1.5 mt-1 font-medium">
            {colors && (
              <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot} animate-pulse`} />
            )}
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
