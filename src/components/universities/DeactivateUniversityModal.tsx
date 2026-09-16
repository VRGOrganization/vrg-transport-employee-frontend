"use client";

import { Ban } from "lucide-react";
import type { University } from "@/types/university.types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface DeactivateUniversityModalProps {
  university: University | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function DeactivateUniversityModal({
  university,
  onClose,
  onConfirm,
  loading,
  error,
}: DeactivateUniversityModalProps) {
  return (
    <ConfirmModal
      open={!!university}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      error={error}
      title="Desativar Faculdade"
      icon={Ban}
      variant="danger"
      confirmLabel="Desativar"
      confirmation={
        university
          ? { kind: "type-identifier", identifier: university.acronym, label: "Confirme a sigla da faculdade" }
          : undefined
      }
      description={
        university && (
          <>
            <p className="text-base font-bold text-on-surface">{university.acronym}</p>
            <p className="text-sm text-on-surface-variant mb-2">{university.name}</p>
            <p>Esta ação desativará a faculdade. Ela não aparecerá mais para novos cadastros.</p>
            {((university.pendingCount ?? 0) > 0 ||
              (university.waitlistedCount ?? 0) > 0 ||
              (university.revisionCount ?? 0) > 0) && (
              <p className="mt-2 font-semibold text-error">
                {university.pendingCount ? `${university.pendingCount} pedido(s) pendente(s)` : null}
                {university.pendingCount && (university.waitlistedCount || university.revisionCount) ? ", " : null}
                {university.waitlistedCount ? `${university.waitlistedCount} na fila de espera` : null}
                {university.waitlistedCount && university.revisionCount ? ", " : null}
                {university.revisionCount ? `${university.revisionCount} em revisão` : null}
                {" "}ficarão sem faculdade vinculada.
              </p>
            )}
          </>
        )
      }
    />
  );
}
