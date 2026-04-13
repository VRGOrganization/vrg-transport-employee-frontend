"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Bus } from "@/types/university.types";

interface Props {
  open: boolean;
  initial?: Bus | null;
  onClose: () => void;
  onSubmit: (data: { identifier: string; capacity: number }) => Promise<void>;
}

export function BusFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setIdentifier(initial?.identifier ?? "");
      setCapacity(initial?.capacity?.toString() ?? "");
      setError("");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!identifier.trim()) { setError("O identificador é obrigatório."); return; }
    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1) { setError("Capacidade deve ser um número maior que zero."); return; }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ identifier: identifier.trim(), capacity: cap });
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
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
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
      </div>
    </div>
  );
}