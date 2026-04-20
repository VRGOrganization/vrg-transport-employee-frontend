"use client";

import { useEffect, useState } from "react";
import { universityApi } from "@/lib/universityApi";
import type { University } from "@/types/university.types";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  currentSlots?: string[]; // universityIds already linked
  onClose: () => void;
  onAdd: (universityId: string, name: string, acronym: string) => void;
}

export default function LinkUniversityModal({ open, currentSlots = [], onClose, onAdd }: Props) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    universityApi
      .list()
      .then((list) => {
        const candidates = list.filter((u) => !currentSlots.includes(u._id));
        setUniversities(candidates);
        setSelected(candidates[0]?._id ?? "");
      })
      .catch(() => setUniversities([]))
      .finally(() => setLoading(false));
  }, [open, currentSlots]);

  if (!open) return null;

  const handleAdd = () => {
    if (!selected) {
      setError("Selecione uma instituição.");
      return;
    }
    const uni = universities.find((u) => u._id === selected);
    if (!uni) {
      setError("Instituição inválida.");
      return;
    }
    onAdd(uni._id, uni.name, uni.acronym);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Vincular faculdade</h2>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando instituições...</p>
        ) : universities.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma instituição disponível para vincular.</p>
        ) : (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-600">Escolha a instituição</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm"
            >
              {universities.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.acronym} — {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <Button type="button" onClick={handleAdd} disabled={loading || universities.length === 0}>
            Vincular
          </Button>
        </div>
      </div>
    </div>
  );
}
