"use client";

import { X } from "lucide-react";
import type { InfoLens } from "@/types/info.types";
import type { LensChip } from "@/hooks/ui/useInfoLens";

interface LensChipsProps {
  chips: LensChip[];
  onRemove: (key: keyof InfoLens) => void;
  onClear: () => void;
}

/**
 * O que está filtrado fica escrito, em português, e some com um clique. É como
 * o usuário nunca se perde dentro de um recorte.
 */
export function LensChips({ chips, onRemove, onClear }: LensChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-6 py-2">
      <span className="text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
        Recorte
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className="group inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 py-0.5 pl-2 pr-1 text-xs font-medium text-on-surface transition-colors duration-150 cursor-pointer hover:border-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {chip.label}
          <X
            className="size-3 text-on-surface-muted transition-colors duration-150 group-hover:text-on-surface"
            aria-hidden="true"
          />
          <span className="sr-only">Remover filtro {chip.label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-1 rounded px-1.5 py-0.5 text-xs text-on-surface-variant underline-offset-2 transition-colors duration-150 cursor-pointer hover:text-on-surface hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Limpar tudo
      </button>
    </div>
  );
}
