"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon | string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-surface-container rounded-lg", className)}>
      {items.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
              active
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {typeof t.icon === "string" ? (
              <span className="material-symbols-outlined text-sm">{t.icon}</span>
            ) : t.icon ? (
              <t.icon className="w-4 h-4" />
            ) : null}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
