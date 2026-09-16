"use client";

import { Ban } from "lucide-react";
import type { Bus } from "@/types/university.types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface DeactivateBusModalProps {
  bus: Bus | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function DeactivateBusModal({ bus, onClose, onConfirm, loading, error }: DeactivateBusModalProps) {
  return (
    <ConfirmModal
      open={!!bus}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      error={error}
      title="Desativar Ônibus"
      icon={Ban}
      variant="danger"
      confirmLabel="Desativar"
      confirmation={
        bus
          ? { kind: "type-identifier", identifier: bus.identifier, label: "Confirme o identificador do ônibus" }
          : undefined
      }
      description={
        bus && (
          <>
            <p className="text-base font-bold text-on-surface">
              {bus.identifier}
              {bus.capacity != null && (
                <span className="ml-2 text-sm font-normal text-on-surface-variant">· {bus.capacity} vagas</span>
              )}
            </p>
            <p className="mt-2">Esta ação desativará o ônibus. Ele não aparecerá mais para novas alocações.</p>
            {!!bus.filledSlotsTotal && bus.filledSlotsTotal > 0 && (
              <p className="mt-2 font-semibold text-error">
                {bus.filledSlotsTotal} aluno{bus.filledSlotsTotal > 1 ? "s estão" : " está"} atualmente alocado
                {bus.filledSlotsTotal > 1 ? "s" : ""} neste ônibus (pico da semana) e perderá
                {bus.filledSlotsTotal > 1 ? "ão" : ""} a vaga.
              </p>
            )}
          </>
        )
      }
    />
  );
}
