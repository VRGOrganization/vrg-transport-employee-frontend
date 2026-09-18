"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/ui/useTheme";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  /** Permite desmarcar clicando na opção já selecionada. */
  allowDeselect?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLUMN_CLASSES = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

/** Indicador desliza entre opções via `layoutId` compartilhado — funciona mesmo com grid que quebra linha. */
export function SegmentedControl({
  options,
  value,
  onChange,
  allowDeselect = true,
  columns = 3,
  className,
}: SegmentedControlProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <div className={cn("grid gap-2", COLUMN_CLASSES[columns], className)}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(selected && allowDeselect ? "" : option.value)}
            aria-pressed={selected}
            className={cn(
              "relative px-2 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30",
              selected
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface",
            )}
          >
            {selected && (
              <motion.span
                layoutId="segment-indicator"
                className="absolute inset-0 rounded-lg bg-primary -z-10"
                transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 320 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
