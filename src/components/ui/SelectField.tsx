import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function SelectField({
  label,
  icon,
  options,
  placeholder,
  error,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
          {label}
        </label>
      )}
      <div className={cn("relative", icon && "group")}>
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-2xl group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        <select
          className={cn(
            "w-full h-14 bg-surface-container-lowest border border-on-surface-variant ring-0 focus:ring-2 focus:ring-primary rounded-xl text-on-surface text-base outline-none transition-all appearance-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon ? "pl-12 pr-4" : "px-4",
            error && "border-error focus:ring-error",
            className
          )}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-error mt-1 ml-1">{error}</p>}
    </div>
  );
}
