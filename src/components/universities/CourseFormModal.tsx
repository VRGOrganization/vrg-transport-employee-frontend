"use client";

import { useState, useEffect } from "react";
import type { Course, CourseModel } from "@/types/university.types";
import { COURSE_MODEL_OPTIONS } from "@/types/university.types";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { StatusBanner } from "@/components/ui/StatusBanner";

interface Props {
  open: boolean;
  initial?: Course | null;
  universityName: string;
  onClose: () => void;
  onSubmit: (data: { name: string; model: CourseModel | null }) => Promise<void>;
}

export function CourseFormModal({ open, initial, universityName, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [model, setModel] = useState<CourseModel | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setModel(initial?.model ?? "");
      setError("");
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("O nome do curso é obrigatório.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), model: model || null });
      onClose();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={initial ? "Editar Curso" : "Novo Curso"}
      description={universityName}
      actions={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth onClick={handleSubmit} loading={loading}>
            {initial ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Nome do curso
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Psicologia"
            className="w-full px-4 py-2.5 rounded-lg border border-on-surface-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Modelo
          </label>
          <div className="flex gap-2">
            {COURSE_MODEL_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setModel(model === option ? "" : option)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  model === option
                    ? "bg-primary text-white border-primary"
                    : "border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {!model && (
            <p className="text-xs text-on-surface-muted mt-1">Opcional</p>
          )}
        </div>
      </div>

      {error && <StatusBanner variant="error" className="mt-4">{error}</StatusBanner>}
    </BottomSheet>
  );
}
