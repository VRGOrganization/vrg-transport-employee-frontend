"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/lib/toast";
import { noticeService } from "@/services/noticeService";

interface Props {
  noticeId: string;
  onDeleted: (noticeId: string) => void;
}

export function DeleteNoticeButton({ noticeId, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await noticeService.deleteNotice(noticeId);
      toast.success("Aviso apagado.");
      onDeleted(noticeId);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao apagar aviso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Apagar aviso"
        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-colors cursor-pointer"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-4" />
      </button>

      {confirming && (
        <ConfirmModal
          open
          onClose={() => setConfirming(false)}
          onConfirm={handleConfirmDelete}
          loading={loading}
          error={error}
          title="Apagar este aviso?"
          icon={Trash2}
          variant="danger"
          description="Ele não vai mais aparecer pra quem ainda não abriu, mas quem já recebeu o push não tem como saber que foi apagado."
          confirmLabel="Sim, apagar"
        />
      )}
    </>
  );
}
