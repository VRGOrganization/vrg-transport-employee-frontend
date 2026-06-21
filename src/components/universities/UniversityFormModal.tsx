"use client";

import { useState, useEffect } from "react";
import type { University } from "@/types/university.types";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { StatusBanner } from "@/components/ui/StatusBanner";

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
    <BottomSheet
      open={open}
      onClose={onClose}
      title={initial ? "Editar Faculdade" : "Nova Faculdade"}
      actions={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth onClick={handleSubmit} loading={loading}>
            {initial ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Nome completo
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Universidade Federal Fluminense"
            className="w-full px-4 py-2.5 rounded-lg border border-on-surface-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Sigla
          </label>
          <input
            value={acronym}
            onChange={(e) => setAcronym(e.target.value.toUpperCase())}
            placeholder="Ex: UFF"
            maxLength={20}
            className="w-full px-4 py-2.5 rounded-lg border border-on-surface-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Endereço
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Rua Miguel de Frias, 9 - Niterói"
            className="w-full px-4 py-2.5 rounded-lg border border-on-surface-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {error && <StatusBanner variant="error" className="mt-4">{error}</StatusBanner>}
    </BottomSheet>
  );
}
