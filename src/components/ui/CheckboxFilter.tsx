"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxFilterProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function CheckboxFilter({ checked, onChange, label, className }: CheckboxFilterProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 cursor-pointer select-none rounded-lg px-2 py-1.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
          checked ? "border-primary bg-primary" : "border-outline-variant bg-transparent",
        )}
      >
        {checked && <Check className="size-3 text-on-primary" strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}
