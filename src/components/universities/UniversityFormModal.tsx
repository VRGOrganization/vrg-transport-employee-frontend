"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { University } from "@/types/university.types";

interface Props {
  open: boolean;
  initial?: University | null;
  onClose: () => void;
  onSubmit: (data: { name: string; acronym: string; address: string }) => Promise<void>;
}

export function UniversityFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setAcronym(initial?.acronym ?? "");
      setAddress(initial?.address ?? "");
      setError("");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim() || !acronym.trim() || !address.trim()) {
      setError("Todos os campos são obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), acronym: acronym.trim(), address: address.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5">
          {initial ? "Editar Faculdade" : "Nova Faculdade"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Nome completo
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Universidade Federal Fluminense"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Sigla
            </label>
            <input
              value={acronym}
              onChange={(e) => setAcronym(e.target.value.toUpperCase())}
              placeholder="Ex: UFF"
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Endereço
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua Miguel de Frias, 9 - Niterói"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

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
              loading
                ? "bg-blue-300 cursor-not-allowed text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {loading ? "Salvando..." : initial ? "Salvar alterações" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}