"use client";

import { useEffect, useState } from "react";
import { universityApi } from "@/lib/universityApi";
import type { University } from "@/types/university.types";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface Props {
  open: boolean;
  currentSlots?: string[];
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
    // Sincronização com API externa (fetch on mount/dependency change) — o
    // extra render de "loading=true" é o custo aceito desse padrão.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Vincular faculdade"
      actions={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleAdd}
            disabled={loading || universities.length === 0}
          >
            Vincular
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="text-sm text-on-surface-variant">Carregando instituições...</p>
      ) : universities.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Nenhuma instituição disponível para vincular.</p>
      ) : (
        <div className="space-y-3">
          <label className="text-sm font-medium text-on-surface-variant">Escolha a instituição</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full h-10 rounded-xl border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface"
          >
            {universities.map((u) => (
              <option key={u._id} value={u._id}>
                {u.acronym}: {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </BottomSheet>
  );
}
