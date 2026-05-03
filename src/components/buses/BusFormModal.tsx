"use client";

import { useState, useEffect } from "react";
import { universityApi } from "@/lib/universityApi";
import { cn } from "@/lib/utils";
import type { Bus } from "@/types/university.types";
import LinkUniversityModal from "./LinkUniversityModal";

type SlotDisplay = { universityId: string; name?: string; acronym?: string; priorityOrder: number; filledSlots?: number };

interface Props {
  open: boolean;
  initial?: Bus | null;
  onClose: () => void;
  // capacity opcional (null = sem limite). Include universitySlots for persistence.
  onSubmit: (data: { identifier: string; capacity?: number | null; universitySlots?: Array<{ universityId: string; priorityOrder: number }>; shift?: string }) => Promise<void>;
}

export function BusFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [capacity, setCapacity] = useState("");
  const [shift, setShift] = useState("");
  const [slots, setSlots] = useState<SlotDisplay[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setIdentifier(initial?.identifier ?? "");
      setCapacity(initial?.capacity?.toString() ?? "");
      setShift(initial?.shift ?? "");
      // hydrate slots from universitySlots or legacy universityIds
      if (initial?.universitySlots && initial.universitySlots.length > 0) {
        setSlots(
          initial.universitySlots.map((s) => ({
            universityId: typeof s.universityId === "string" ? s.universityId : s.universityId._id,
            acronym: typeof s.universityId === "string" ? undefined : s.universityId.acronym,
            name: typeof s.universityId === "string" ? undefined : s.universityId.name,
            priorityOrder: s.priorityOrder,
            filledSlots: s.filledSlots,
          }))
        );
      } else if ((initial?.universityIds ?? []).length > 0) {
        setSlots(
          (initial?.universityIds ?? []).map((u, idx) => ({
            universityId: typeof u === "string" ? u : u._id,
            name: typeof u === "string" ? undefined : u.name,
            acronym: typeof u === "string" ? undefined : u.acronym,
            priorityOrder: idx + 1,
          }))
        );
      } else {
        setSlots([]);
      }

      setError("");
    }
  }, [open, initial]);

  // If any slot is missing acronym/name (e.g. only have IDs), fetch universities to fill acronyms.
  useEffect(() => {
    if (!open) return;
    // only run when there are slots with missing display data
    const missing = slots.some((s) => !s.acronym && !s.name);
    if (!missing) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await universityApi.list();
        const arr = Array.isArray(res) ? res : (res as any)?.data ?? [];
        const map: Record<string, { acronym?: string; name?: string }> = {};
        arr.forEach((u: any) => {
          if (u && u._id) map[u._id] = { acronym: u.acronym, name: u.name };
        });
        if (cancelled) return;
        setSlots((prev) =>
          prev.map((s) => ({
            ...s,
            acronym: s.acronym ?? map[s.universityId]?.acronym,
            name: s.name ?? map[s.universityId]?.name,
          }))
        );
      } catch (e) {
        // ignore failures silently
      }
    })();

    return () => {
      cancelled = true;
    };
    // only re-run when modal opens or slot list length changes
  }, [open, slots.length]);

  if (!open) return null;

  const handleAddSlot = (id: string, name?: string, acronym?: string) => {
    setSlots((prev) => [...prev, { universityId: id, name, acronym, priorityOrder: prev.length + 1 }]);
  };

  const handleRemove = (universityId: string) => {
    setSlots((prev) => {
      const filtered = prev.filter((s) => s.universityId !== universityId);
      // reindex priorities
      return filtered.map((s, idx) => ({ ...s, priorityOrder: idx + 1 }));
    });
  };

  const handleMove = (universityId: string, direction: "up" | "down") => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.universityId === universityId);
      if (idx === -1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = prev.slice();
      const tmp = next[swapIdx];
      next[swapIdx] = next[idx];
      next[idx] = tmp;
      return next.map((s, i) => ({ ...s, priorityOrder: i + 1 }));
    });
  };

  const handleMoveUp = (id: string) => handleMove(id, "up");
  const handleMoveDown = (id: string) => handleMove(id, "down");

  const handleSubmit = async () => {
    if (!identifier.trim()) { setError("O identificador é obrigatório."); return; }
    let cap: number | undefined = undefined;
    const trimmed = capacity.trim();
    if (trimmed.length > 0) {
      const parsed = parseInt(trimmed, 10);
      if (Number.isNaN(parsed) || parsed < 1) { setError("Capacidade deve ser um número maior que zero ou vazia para sem limite."); return; }
      cap = parsed;
    }

    setLoading(true);
    setError("");
    try {
      const payload: { identifier: string; capacity?: number | null; universitySlots?: Array<{ universityId: string; priorityOrder: number }>; shift?: string } = {
        identifier: identifier.trim(),
        capacity: cap ?? null,
      };
      if (slots.length > 0) payload.universitySlots = slots.map((s) => ({ universityId: s.universityId, priorityOrder: s.priorityOrder }));
      if (shift && shift.length > 0) payload.shift = shift;

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5">
          {initial ? "Editar Ônibus" : "Novo Ônibus"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Identificador
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ex: Ônibus 03"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Capacidade de passageiros
            </label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Ex: 48"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Período principal do ônibus</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhum</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Faculdades vinculadas</label>
            <div className="flex flex-col gap-2">
              {slots.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhuma faculdade vinculada</p>
              ) : (
                slots.map((s) => (
                  <div key={s.universityId} className="flex items-center justify-between gap-3 py-1 px-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm font-medium text-blue-600">{s.acronym ?? s.name?.charAt(0) ?? "U"}</div>
                      <div className="text-sm">
                        <div className="font-medium text-slate-800 dark:text-slate-100">{s.acronym ?? s.name}</div>
                        <div className="text-xxs text-slate-400">Prioridade P{s.priorityOrder}{s.filledSlots ? ` • ${s.filledSlots}` : ""}</div>
                      </div>
                    </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(s.universityId)}
                            disabled={s.priorityOrder <= 1}
                            className={cn(
                              "p-1 rounded-md text-slate-500 hover:bg-slate-50",
                              s.priorityOrder <= 1 ? "opacity-40 cursor-not-allowed" : ""
                            )}
                            title="Mover para cima"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(s.universityId)}
                            disabled={s.priorityOrder >= slots.length}
                            className={cn(
                              "p-1 rounded-md text-slate-500 hover:bg-slate-50",
                              s.priorityOrder >= slots.length ? "opacity-40 cursor-not-allowed" : ""
                            )}
                            title="Mover para baixo"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_downward</span>
                          </button>
                          <button type="button" onClick={() => handleRemove(s.universityId)} className="text-red-500 text-sm">Remover</button>
                        </div>
                  </div>
                ))
              )}
              <div>
                <button type="button" onClick={() => setLinkOpen(true)} className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm">Vincular faculdade</button>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              loading ? "bg-blue-300 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {loading ? "Salvando..." : initial ? "Salvar" : "Cadastrar"}
          </button>
        </div>

        <LinkUniversityModal open={linkOpen} currentSlots={slots.map((s) => s.universityId)} onClose={() => setLinkOpen(false)} onAdd={handleAddSlot} />
      </div>
    </div>
  );
}