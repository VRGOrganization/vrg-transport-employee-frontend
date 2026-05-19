"use client";

import { useState, useEffect } from "react";
import type { Course } from "@/types/university.types";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { StatusBanner } from "@/components/ui/StatusBanner";

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
    <BottomSheet
      open={open}
      onClose={onClose}
      title={initial ? "Editar Curso" : "Novo Curso"}
      description={universityName}
      closeOnOverlay={!loading}
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

      {error && <StatusBanner variant="error" className="mt-4">{error}</StatusBanner>}
    </BottomSheet>
  );
}
