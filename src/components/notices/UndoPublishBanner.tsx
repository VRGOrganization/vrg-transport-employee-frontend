"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

interface Props {
  notice: Notice;
  onUndo: () => void;
  /** Chamado uma vez quando a contagem chega a zero, pra quem estiver
   * ouvindo saber que o aviso passou de "agendado" pra "publicado" de
   * verdade e precisa re-buscar a lista (o status local fica obsoleto
   * silenciosamente se ninguém reagir a isso). */
  onExpire?: () => void;
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

export function UndoPublishBanner({ notice, onUndo, onExpire }: Props) {
  const secondsLeft = useCountdown(notice.publishAt);
  const [loading, setLoading] = useState(false);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (secondsLeft > 0 || hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    onExpire?.();
  }, [secondsLeft, onExpire]);

  if (secondsLeft <= 0) return null;

  const handleUndo = async () => {
    setLoading(true);
    try {
      await noticeService.cancelScheduledNotice(notice.id);
      toast.success("Aviso cancelado.");
      onUndo();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Erro ao cancelar aviso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-warning-container border border-warning-border px-4 py-3 text-sm text-on-warning">
      <span>Publicando em {secondsLeft}s</span>
      <button
        type="button"
        disabled={loading}
        className="font-bold underline cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        onClick={() => void handleUndo()}
      >
        {loading ? "Cancelando…" : "Desfazer"}
      </button>
    </div>
  );
}
