"use client";

import { useMemo, useState } from "react";
import type { Bus } from "@/types/university.types";
import { busApi } from "@/lib/universityApi";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";

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
    const plan: Array<{ universityAcronym?: string; priorityOrder: number; promote: number; waitlistedCount: number }> = [];
    waitlistedByPriority.reduce((remaining, slot) => {
      if (remaining <= 0) return 0;
      const avail = slot.waitlistedCount || 0;
      if (avail <= 0) return remaining;
      if (avail <= remaining) {
        plan.push({ universityAcronym: slot.universityAcronym, priorityOrder: slot.priorityOrder, promote: avail, waitlistedCount: avail });
        return remaining - avail;
      }
      plan.push({ universityAcronym: slot.universityAcronym, priorityOrder: slot.priorityOrder, promote: remaining, waitlistedCount: avail });
      return 0;
    }, Math.max(0, Math.floor(q)));
    return plan;
  }, [quantity, totalWaitlisted, waitlistedByPriority]);

  if (!bus) return null;

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
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Liberar vagas — ${bus.identifier}`}
      closeOnOverlay={!loading}
      actions={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleConfirm}
            loading={loading}
            disabled={quantity !== null && quantity <= 0}
          >
            Confirmar
          </Button>
        </div>
      }
    >
      <p className="text-sm text-on-surface-variant mb-4">
        Total na fila: <strong>{totalWaitlisted}</strong>. Selecione quantas vagas deseja liberar.
      </p>

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

      {error && <StatusBanner variant="error" className="mt-2">{error}</StatusBanner>}
    </BottomSheet>
  );
}
