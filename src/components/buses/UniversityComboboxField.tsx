"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/ui/useTheme";
import { Plus, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalOverlayPortal } from "@/components/ui/ModalOverlayPortal";
import type { University } from "@/types/university.types";

interface Props {
  universities: University[];
  loading?: boolean;
  disabled?: boolean;
  triggerLabel?: string;
  onSelect: (university: University) => void;
}

/**
 * Popover de busca centralizado na tela, por cima do Modal que o abre — não
 * um combobox ancorado ao campo. Um segundo overlay (antes um BottomSheet,
 * z-40) renderizando dentro de um Modal (z-50) sempre ficava atrás dele;
 * este popover usa `--z-modal-popover` (60), acima de `--z-modal`, e faz
 * portal para `document.body` (mesmo padrão de `Modal.tsx`/`Dropdown.tsx`),
 * então nunca fica preso atrás nem cortado pelo `overflow-y-auto` do Modal.
 */
export function UniversityComboboxField({ universities, loading, disabled, triggerLabel = "Vincular faculdade", onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter(
      (u) => u.acronym.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [universities, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setHighlighted(0);
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView?.({ block: "nearest" });
  }, [highlighted, open]);

  const handleSelect = (university: University) => {
    onSelect(university);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[highlighted];
      if (target) handleSelect(target);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-fixed text-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="size-4" />
        {triggerLabel}
      </button>

      <ModalOverlayPortal>
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[var(--z-modal-popover)] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
              onClick={(e) => e.target === e.currentTarget && close()}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Vincular faculdade"
                className="w-full max-w-sm max-h-[80vh] rounded-2xl bg-surface-container-lowest shadow-xl flex flex-col overflow-hidden"
                initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
              >
                <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
                  <h2 className="text-sm font-bold text-on-surface">Vincular Faculdade</h2>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Fechar"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="px-4 pb-3 shrink-0">
                  <div className="flex items-center gap-2 h-10 rounded-xl border border-on-surface-variant bg-surface-container-low px-3">
                    <Search className="size-4 text-on-surface-variant shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      role="combobox"
                      aria-expanded={open}
                      aria-controls="university-combobox-list"
                      autoComplete="off"
                      value={query}
                      placeholder={loading ? "Carregando faculdades..." : "Buscar por nome ou sigla..."}
                      onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2">
                  {loading ? (
                    <p className="px-2 py-3 text-sm text-on-surface-variant">Carregando faculdades...</p>
                  ) : filtered.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-on-surface-variant">
                      {universities.length === 0 ? "Nenhuma faculdade disponível para vincular." : "Nenhuma faculdade encontrada."}
                    </p>
                  ) : (
                    <ul id="university-combobox-list" ref={listRef} role="listbox" className="space-y-0.5">
                      {filtered.map((u, idx) => (
                        <li key={u._id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={idx === highlighted}
                            onClick={() => handleSelect(u)}
                            onMouseEnter={() => setHighlighted(idx)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                              idx === highlighted ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container-low"
                            )}
                          >
                            <span className="truncate">
                              <span className="font-medium">{u.acronym}</span>
                              <span className="text-on-surface-variant"> · {u.name}</span>
                            </span>
                            {idx === highlighted && <Check className="size-4 shrink-0" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalOverlayPortal>
    </>
  );
}
