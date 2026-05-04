"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/university.types";

interface Props {
  open: boolean;
  initial?: Course | null;
  universityName: string;
  onClose: () => void;
  onSubmit: (data: { name: string }) => Promise<void>;
}

export function CourseFormModal({ open, initial, universityName, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setError("");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("O nome do curso é obrigatório.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name: name.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-on-surface mb-1">
          {initial ? "Editar Curso" : "Novo Curso"}
        </h2>
        <p className="text-sm text-on-surface-variant mb-5">
          {universityName}
        </p>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Nome do curso
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Psicologia"
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              loading
                ? "bg-primary/50 cursor-not-allowed text-white"
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            {loading ? "Salvando..." : initial ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
