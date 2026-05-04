"use client";

import { useMemo, useState } from "react";
import type { Bus } from "@/types/university.types";
import { busApi } from "@/lib/universityApi";

interface BusReleaseModalProps {
  open: boolean;
  bus: Bus | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BusReleaseModal({ open, bus, onClose, onSuccess }: BusReleaseModalProps) {
  const [quantity, setQuantity] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalWaitlisted = useMemo(() => {
    if (!bus) return 0;
    if (typeof bus.waitlistedCount === "number") return bus.waitlistedCount;
    const slots = (bus.universitySlots ?? []) as any[];
    return slots.reduce((acc, s) => acc + (s.waitlistedCount || 0), 0);
  }, [bus]);

  const waitlistedByPriority = useMemo(() => {
    if (!bus) return [] as Array<{ universityAcronym?: string; priorityOrder: number; waitlistedCount: number; universityId?: string }>;
    const slots = (bus.universitySlots ?? []) as any[];
    const ordered = [...slots].sort((a, b) => (a.priorityOrder ?? 0) - (b.priorityOrder ?? 0));
    return ordered.map((s) => ({
      universityAcronym: s.universityId?.acronym ?? s.acronym ?? undefined,
      priorityOrder: s.priorityOrder ?? 0,
      waitlistedCount: s.waitlistedCount ?? 0,
      universityId: typeof s.universityId === 'string' ? s.universityId : s.universityId?._id,
    }));
  }, [bus]);

  const preview = useMemo(() => {
    const q = quantity ?? totalWaitlisted ?? 0;
    let remaining = Math.max(0, Math.floor(q));
    const plan: Array<{ universityAcronym?: string; priorityOrder: number; promote: number; waitlistedCount: number }> = [];
    for (const slot of waitlistedByPriority) {
      if (remaining <= 0) break;
      const avail = slot.waitlistedCount || 0;
      if (avail <= 0) continue;
      if (avail <= remaining) {
        plan.push({ universityAcronym: slot.universityAcronym, priorityOrder: slot.priorityOrder, promote: avail, waitlistedCount: avail });
        remaining -= avail;
        continue;
      }
      plan.push({ universityAcronym: slot.universityAcronym, priorityOrder: slot.priorityOrder, promote: remaining, waitlistedCount: avail });
      remaining = 0;
      break;
    }
    return plan;
  }, [quantity, totalWaitlisted, waitlistedByPriority]);

  if (!open || !bus) return null;

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const q = quantity ?? totalWaitlisted ?? undefined;
      await busApi.releaseSlots(bus._id, true, q as any);
      setLoading(false);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setLoading(false);
      setError(err?.message ?? "Erro ao liberar vagas");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold text-on-surface mb-4">Liberar vagas — {bus.identifier}</h2>

        <p className="text-sm text-on-surface-variant mb-4">Total na fila: <strong>{totalWaitlisted}</strong>. Selecione quantas vagas deseja liberar.</p>

        <div className="mb-4">
          <label className="block text-sm text-on-surface-variant mb-2">Quantas vagas liberar?</label>
          <input
            type="number"
            min={1}
            max={Math.max(1, totalWaitlisted)}
            value={quantity ?? ''}
            onChange={(e) => setQuantity(e.target.value ? Math.max(0, parseInt(e.target.value, 10)) : null)}
            placeholder={`${totalWaitlisted}`}
            className="w-full px-4 py-2.5 rounded-md border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="mb-4">
          <div className="text-sm text-on-surface-variant mb-2">Preview de promoções por prioridade</div>
          <div className="space-y-2 text-sm">
            {preview.length === 0 ? (
              <div className="text-xs text-on-surface-muted italic">Nenhuma promoção prevista com a quantidade selecionada.</div>
            ) : (
              preview.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="text-sm text-on-surface">P{p.priorityOrder} {p.universityAcronym ? `· ${p.universityAcronym}` : ''}</div>
                  <div className="text-sm font-medium text-on-surface">{p.promote} promovido(s)</div>
                </div>
              ))
            )}
          </div>
        </div>

        {error && <div className="text-sm text-error mb-3">{error}</div>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm hover:bg-surface-container-low transition-colors">Cancelar</button>
          <button onClick={handleConfirm} disabled={loading || (quantity !== null && quantity <= 0)} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm transition-colors">
            {loading ? 'Processando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
