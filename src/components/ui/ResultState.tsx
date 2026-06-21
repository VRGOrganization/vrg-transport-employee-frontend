import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ResultStateVariant = "success" | "warning" | "error" | "neutral";

interface ResultStateProps {
  variant: ResultStateVariant;
  icon: LucideIcon;
  title: string;
  description?: string;
  footerBadge?: string;
  actions?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

const variantStyles: Record<ResultStateVariant, { circle: string; icon: string }> = {
  success: { circle: "bg-success/10",  icon: "text-success"          },
  warning: { circle: "bg-warning/10",  icon: "text-on-warning"       },
  error:   { circle: "bg-error/10",    icon: "text-error"             },
  neutral: { circle: "bg-surface-container-high", icon: "text-on-surface-variant" },
};

export function ResultState({
  variant,
  icon: Icon,
  title,
  description,
  footerBadge,
  actions,
  className,
  size = "md",
}: ResultStateProps) {
  const { circle, icon } = variantStyles[variant];

  return (
    <div className={cn("flex flex-col items-center text-center gap-5", className)}>
      <div className={cn("rounded-full flex items-center justify-center", circle, size === "md" ? "p-5" : "p-3.5")}>
        <Icon className={cn(icon, size === "md" ? "w-10 h-10" : "w-7 h-7")} />
      </div>

      <div className="space-y-1">
        <h2 className={cn("font-headline font-semibold text-on-surface", size === "md" ? "text-xl" : "text-base")}>
          {title}
        </h2>
        {description && (
          <p className="text-sm text-on-surface-variant max-w-xs">{description}</p>
        )}
      </div>

      {footerBadge && (
        <div className="bg-surface-container rounded-xl px-4 py-2.5 text-sm text-on-surface-variant max-w-xs">
          {footerBadge}
        </div>
      )}

      {actions && <div className="flex gap-3 w-full justify-center">{actions}</div>}
    </div>
  );
}
