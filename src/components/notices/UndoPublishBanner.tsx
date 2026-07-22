"use client";

import { useEffect, useState } from "react";
import { CircleX } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/lib/toast";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

interface Props {
  notice: Notice;
  onUndo: () => void;
}

function computeSecondsLeft(targetDate: string): number {
  return Math.max(0, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 1000));
}

function useCountdown(targetDate: string): number {
  const [secondsLeft, setSecondsLeft] = useState(() => computeSecondsLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(computeSecondsLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return secondsLeft;
}

export function UndoPublishBanner({ notice, onUndo }: Props) {
  const secondsLeft = useCountdown(notice.publishAt);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (secondsLeft <= 0) return null;

  const handleConfirmUndo = async () => {
    setLoading(true);
    setError("");
    try {
      await noticeService.cancelScheduledNotice(notice.id);
      toast.success("Aviso cancelado.");
      setConfirming(false);
      onUndo();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao cancelar aviso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-warning-container border border-warning-border px-4 py-3 text-sm text-on-warning">
        <span>Publicando em {secondsLeft}s</span>
        <button
          type="button"
          className="font-bold underline cursor-pointer"
          onClick={() => setConfirming(true)}
        >
          Desfazer
        </button>
      </div>

      {confirming && (
        <ConfirmModal
          open
          onClose={() => setConfirming(false)}
          onConfirm={handleConfirmUndo}
          loading={loading}
          error={error}
          title="Cancelar este aviso?"
          icon={CircleX}
          variant="danger"
          description="Ele não será publicado."
          confirmLabel="Sim, cancelar"
        />
      )}
    </>
  );
}
