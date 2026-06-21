import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FieldShellProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ label, error, required, hint, className, children }: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-on-surface-variant ml-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-error ml-1">{error}</p>
      )}
    </div>
  );
}
