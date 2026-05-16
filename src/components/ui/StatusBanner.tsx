"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StatusBannerVariant = "error" | "warning" | "success" | "info";

interface StatusBannerProps {
  variant: StatusBannerVariant;
  children: ReactNode;
  icon?: LucideIcon;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<StatusBannerVariant, { classes: string; DefaultIcon: LucideIcon }> = {
  error:   { classes: "bg-error-container border border-error-border text-error",          DefaultIcon: AlertCircle   },
  warning: { classes: "bg-warning-container border border-warning-border text-on-warning", DefaultIcon: TriangleAlert },
  success: { classes: "bg-success-container border border-success/30 text-success",        DefaultIcon: CheckCircle2  },
  info:    { classes: "bg-info-container border border-info-border text-on-info",          DefaultIcon: Info          },
};

export function StatusBanner({ variant, children, icon, onClose, className }: StatusBannerProps) {
  const { classes, DefaultIcon } = variantConfig[variant];
  const Icon = icon ?? DefaultIcon;

  return (
    <div className={cn("flex items-start gap-2 text-sm rounded-xl px-4 py-3", classes, className)}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
