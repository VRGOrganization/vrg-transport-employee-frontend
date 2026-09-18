"use client";

import { useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";

export interface FilterOption {
  value: string;
  label: string;
  /** Texto auxiliar à direita (contagem, sigla). */
  hint?: string;
  /** Marcação discreta (ex.: faculdade temporária). */
  badge?: string;
}

interface FilterPopoverProps {
  /** Rótulo do eixo — aparece sempre, para o botão nunca virar placeholder. */
  name: string;
  value: string | null;
  options: FilterOption[];
  onChange: (next: string | null) => void;
  disabled?: boolean;
  disabledHint?: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
  icon?: ReactNode;
  /** Listas curtas (poucas opções fixas) dispensam o campo de busca. */
  searchable?: boolean;
}

/**
 * Botão-popover com busca interna. Não é `<select>` nativo: as listas de
 * faculdade e curso passam de dezenas de itens e precisam de filtro.
 */
export function FilterPopover({
  name,
  value,
  options,
  onChange,
  disabled = false,
  disabledHint,
  emptyLabel = "Todos",
  searchPlaceholder = "Buscar…",
  icon,
  searchable = true,
}: FilterPopoverProps) {
  const [query, setQuery] = useState("");
  const listboxId = useId();

  const selected = options.find((o) => o.value === value) ?? null;

  const normalized = query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

  const filtered = normalized
    ? options.filter((o) =>
        o.label
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLocaleLowerCase("pt-BR")
          .includes(normalized),
      )
    : options;

  /** Toda seleção limpa a busca — reabrir começa do zero, sem estado velho. */
  function pick(next: string | null) {
    onChange(next);
    setQuery("");
  }

  return (
    <Dropdown
      menuClassName="w-64 p-1 border border-outline-variant ring-0 shadow-none [box-shadow:var(--shadow-modal)]"
      trigger={(open) => (
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          title={disabled ? disabledHint : undefined}
          className={cn(
            "inline-flex h-9 max-w-56 items-center gap-1.5 rounded-lg border px-2.5 text-sm",
            "transition-colors duration-150 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            selected
              ? "border-primary/50 bg-primary/8 text-on-surface"
              : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:border-outline",
            disabled && "opacity-40 cursor-not-allowed",
          )}
        >
          {icon}
          <span className="text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
            {name}
          </span>
          <span className="truncate font-medium">
            {selected ? selected.label : emptyLabel}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-on-surface-muted transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>
      )}
    >
      <div id={listboxId} role="listbox" aria-label={name}>
        {/* stopPropagation: a busca não é uma opção — clicar/digitar aqui não deve fechar o menu (o Dropdown fecha ao clicar em qualquer lugar do conteúdo). */}
        {searchable && (
          <div
            className="flex items-center gap-1.5 border-b border-outline-variant px-2 pb-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Search className="size-3.5 shrink-0 text-on-surface-muted" />
            <input
              // Reabre montado do zero a cada abertura do Dropdown — não é autofocus de página.
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={`Buscar em ${name}`}
              className="h-7 w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-muted"
            />
          </div>
        )}

        <div className="max-h-64 overflow-y-auto py-1">
          <Option
            label={emptyLabel}
            selected={value === null}
            onSelect={() => pick(null)}
          />
          {filtered.map((option) => (
            <Option
              key={option.value}
              label={option.label}
              hint={option.hint}
              badge={option.badge}
              selected={option.value === value}
              onSelect={() => pick(option.value)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="px-2.5 py-3 text-center text-xs text-on-surface-muted">
              Nada encontrado.
            </p>
          )}
        </div>
      </div>
    </Dropdown>
  );
}

function Option({
  label,
  hint,
  badge,
  selected,
  onSelect,
}: {
  label: string;
  hint?: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm",
        "transition-colors duration-150 cursor-pointer",
        selected
          ? "bg-primary/10 text-on-surface"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
      )}
    >
      <Check
        className={cn("size-3.5 shrink-0", selected ? "text-primary" : "opacity-0")}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && (
        <span className="shrink-0 rounded border border-outline-variant px-1 text-[10px] uppercase tracking-wide text-on-surface-muted">
          {badge}
        </span>
      )}
      {hint && (
        <span className="shrink-0 text-xs tabular-nums text-on-surface-muted">
          {hint}
        </span>
      )}
    </button>
  );
}
