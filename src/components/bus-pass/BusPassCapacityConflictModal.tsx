"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { BusPassCapacityConflict } from "@/types/busPass";

interface BusPassCapacityConflictModalProps {
  open: boolean;
  conflict: BusPassCapacityConflict | null;
  onClose: () => void;
  onReject: () => void;
  onRequestRevision: () => void;
}

/**
 * Abre quando a aprovação volta 409: o ônibus lotou entre o pedido e o clique.
 * A decisão é do operador — negar de vez, ou devolver ao aluno para ele
 * escolher outro ônibus. O backend não escolhe por ele.
 */
export function BusPassCapacityConflictModal({
  open,
  conflict,
  onClose,
  onReject,
  onRequestRevision,
}: BusPassCapacityConflictModalProps) {
  const legLabel = conflict?.leg === "inbound" ? "volta" : "ida";

  return (
    <Modal open={open} onClose={onClose} title="Ônibus lotado" size="sm">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="text-warning" size={20} />
          </div>
          <p className="text-sm text-on-surface-variant">
            O ônibus{" "}
            <strong className="text-on-surface">
              {conflict?.busIdentifier ?? "escolhido"}
            </strong>{" "}
            (perna de {legLabel}) encheu antes da aprovação. O passe continua
            pendente.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onRequestRevision}>
            Devolver ao aluno para escolher outro
          </Button>
          <Button variant="outline" onClick={onReject}>
            Negar o passe
          </Button>
          <Button variant="outline" onClick={onClose}>
            Decidir depois
          </Button>
        </div>
      </div>
    </Modal>
  );
}
