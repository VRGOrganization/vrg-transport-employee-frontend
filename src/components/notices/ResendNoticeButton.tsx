"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/lib/toast";
import { noticeService } from "@/services/noticeService";

interface Props {
  noticeId: string;
}

export function ResendNoticeButton({ noticeId }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmResend = async () => {
    setLoading(true);
    setError("");
    try {
      await noticeService.resendNotice(noticeId);
      toast.success("Notificação reenviada aos alunos.");
      setConfirming(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao reenviar notificação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Reenviar notificação"
        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
        onClick={() => setConfirming(true)}
      >
        <Bell className="size-4" />
      </button>

      {confirming && (
        <ConfirmModal
          open
          onClose={() => setConfirming(false)}
          onConfirm={handleConfirmResend}
          loading={loading}
          error={error}
          title="Reenviar notificação?"
          icon={Bell}
          variant="warning"
          description="Este aviso já foi enviado automaticamente aos alunos quando foi criado. Reenviar dispara a mesma notificação de novo — não cria um aviso novo, só ajuda quem não recebeu o push da primeira vez."
          confirmLabel="Reenviar"
        />
      )}
    </>
  );
}
