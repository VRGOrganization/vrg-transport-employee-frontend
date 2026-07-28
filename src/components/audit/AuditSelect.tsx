"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuditSelectOption {
  value: string;
  label: string;
}

interface AuditSelectProps {
  label: string;
  value: string;
  options: AuditSelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Select custom (não usa `<option>` nativo, que renderiza feio e sem controle
 * de estilo). Dropdown com opções bonitas, marca a selecionada, fecha ao clicar
 * fora ou apertar Esc. Altura padronizada (h-11) com os demais campos.
 */
export function AuditSelect({
  label,
  value,
  options,
  onChange,
  className,
}: AuditSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "w-full h-11 pl-3 pr-9 rounded-lg text-sm text-left text-on-surface bg-surface-container-lowest ring-1 ring-outline/40 transition-all cursor-pointer relative",
          "hover:ring-outline focus:ring-2 focus:ring-primary outline-none",
          open && "ring-2 ring-primary",
        )}
      >
        <span className="block truncate">{selected?.label}</span>
        <ChevronDown
          className={cn(
            "size-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-xl bg-surface-container-lowest ring-1 ring-outline/30 shadow-xl p-1"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value || "__all__"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface hover:bg-surface-container-high",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && <Check className="size-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
