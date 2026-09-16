"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditParticipant } from "@/types/audit";

const PAGE_SIZE = 8;

interface ParticipantComboboxProps {
  label: string;
  /** id selecionado (interno). O usuário sempre vê o NOME. */
  value: string;
  participants: AuditParticipant[];
  loading?: boolean;
  onChange: (id: string) => void;
  className?: string;
  /** Destaca funcionários (staff) na lista. */
  highlightStaff?: boolean;
}

function displayName(p: AuditParticipant): string {
  return p.name?.trim() || "Sem nome";
}

/**
 * Combobox com autocomplete para escolher uma pessoa/aluno por NOME (guarda o id
 * internamente — o admin nunca vê id). Ao abrir mostra "Todos" + uma página de
 * registros com botões de início/fim. Digitar filtra por nome de forma
 * incremental (G → Gustavo, Guilherme…; Gust → filtra mais). Mostra
 * "Não encontrado" quando nada casa.
 */
export function ParticipantCombobox({
  label,
  value,
  participants,
  loading = false,
  onChange,
  className,
  highlightStaff = false,
}: ParticipantComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = participants.find((p) => p.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return participants;
    // filtro incremental: casa cada termo digitado contra o nome
    const terms = q.split(/\s+/);
    return participants.filter((p) => {
      const name = displayName(p).toLowerCase();
      return terms.every((t) => name.includes(t));
    });
  }, [participants, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const updateQuery = (next: string) => {
    setQuery(next);
    setPage(0);
  };

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
    setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

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
          "w-full h-11 pl-3 pr-9 rounded-lg text-sm text-left bg-surface-container-lowest ring-1 ring-outline/40 transition-all cursor-pointer relative",
          "hover:ring-outline focus:ring-2 focus:ring-primary outline-none",
          open && "ring-2 ring-primary",
        )}
      >
        <span
          className={cn(
            "block truncate",
            selected ? "text-on-surface" : "text-on-surface-variant/70",
          )}
        >
          {selected ? displayName(selected) : "Todos"}
        </span>
        {selected ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }
            }}
            aria-label="Limpar seleção"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <X className="size-4" />
          </span>
        ) : (
          <ChevronDown
            className={cn(
              "size-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {open && (
        <div className="absolute z-[var(--z-dropdown)] mt-1 w-full rounded-xl bg-surface-container-lowest ring-1 ring-outline/30 shadow-xl p-2">
          {/* Busca */}
          <div className="relative mb-2">
            <Search className="size-4 text-on-surface-variant absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              placeholder="Digite um nome…"
              className="w-full h-9 pl-8 pr-3 rounded-lg text-sm bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <ul role="listbox" className="max-h-64 overflow-y-auto">
            {/* opção "Todos" */}
            {!query.trim() && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ""}
                  onClick={() => pick("")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                    value === ""
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface hover:bg-surface-container-high",
                  )}
                >
                  Todos
                </button>
              </li>
            )}

            {loading ? (
              <li className="px-3 py-6 text-center text-sm text-on-surface-variant">
                Carregando…
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-on-surface-variant">
                Não encontrado
              </li>
            ) : (
              pageItems.map((p) => {
                const active = p.id === value;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(p.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-on-surface hover:bg-surface-container-high",
                      )}
                    >
                      <span className="truncate">{displayName(p)}</span>
                      {highlightStaff && p.isStaff && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                          <ShieldCheck className="size-3" />
                          Funcionário
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* Paginação interna: início / fim */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setPage(0)}
                disabled={safePage === 0}
                title="Voltar ao início"
                className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsLeft className="size-4" />
              </button>
              <span className="text-xs text-on-surface-variant">
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(totalPages - 1)}
                disabled={safePage === totalPages - 1}
                title="Ir para o fim"
                className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
