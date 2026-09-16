"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";

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
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
        {label}
      </label>
      <Dropdown
        className="block w-full"
        matchTriggerWidth
        menuClassName="min-w-0 max-h-64 overflow-y-auto"
        trigger={(open) => (
          <button
            type="button"
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
        )}
      >
        <ul role="listbox">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value || "__all__"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onChange(opt.value)}
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
      </Dropdown>
    </div>
  );
}
