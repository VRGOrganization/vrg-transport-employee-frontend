"use client";

import { useState } from "react";
import { Pin, PinOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

interface Props {
  noticeId: string;
  pinned: boolean;
  onToggled: (notice: Notice) => void;
}

export function TogglePinButton({ noticeId, pinned, onToggled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const updated = await noticeService.togglePin(noticeId, !pinned);
      onToggled(updated);
      toast.success(pinned ? "Aviso desafixado." : "Aviso fixado.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Erro ao fixar/desafixar aviso");
    } finally {
      setLoading(false);
    }
  };

  const Icon = pinned ? PinOff : Pin;

  return (
    <button
      type="button"
      aria-label={pinned ? "Desafixar aviso" : "Fixar aviso"}
      disabled={loading}
      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      onClick={handleClick}
    >
      <Icon className="size-4" />
    </button>
  );
}
