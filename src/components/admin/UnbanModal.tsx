"use client";

import { useId, useRef, useState } from "react";
import { X, ShieldCheck, Loader2, AlertCircle, Calendar } from "lucide-react";
import { banlistService } from "@/services/banlistService";
import { resolveDisplayName, toTitleCase } from "@/lib/utils/string";
import { useModalA11y } from "@/hooks/ui/useModalA11y";
import { toast } from "@/lib/toast";
import type { BanlistEntry } from "@/types/banlist";

interface UnbanModalProps {
  open: boolean;
  entry: BanlistEntry;
  onClose: () => void;
  onSuccess: () => void;
}

export function UnbanModal({ open, entry, onClose, onSuccess }: UnbanModalProps) {
  const [unbanReasons, setUnbanReasons] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(panelRef, onClose);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unbanReasons.trim()) {
      setError("Informe o motivo do desbanimento.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await banlistService.unban(entry.studentId, [unbanReasons.trim()]);
      toast.success("Banimento removido com sucesso.");
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao remover banimento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const bannedDate = new Date(entry.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden outline-none"
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-success/10 flex items-center justify-center">
              <ShieldCheck className="size-5 text-success" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-bold text-on-surface">Remover Banimento</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Esta ação reintegrará o estudante ao sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Student info */}
        <div className="px-6 py-4 bg-surface-container-low/50 border-b border-outline-variant/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-full bg-error/10 flex items-center justify-center text-error font-bold text-sm">
              {resolveDisplayName(entry).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-on-surface text-sm">{toTitleCase(resolveDisplayName(entry))}</p>
              {entry.socialName?.trim() && (
                <p className="text-xs text-on-surface-variant">Nome de registro: {toTitleCase(entry.name)}</p>
              )}
              <p className="text-xs text-on-surface-variant">{entry.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Banido em {bannedDate}
            </span>
          </div>

          {entry.reasons.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Motivos do banimento
              </p>
              <div className="space-y-1">
                {entry.reasons.map((reason, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-on-surface bg-error/5 border border-error/15 rounded-lg px-3 py-2"
                  >
                    <span className="text-error mt-0.5 shrink-0">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-error-container/60 text-error text-xs">
              <AlertCircle className="size-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">
              Motivo do desbanimento <span className="text-error">*</span>
            </label>
            <textarea
              value={unbanReasons}
              onChange={(e) => { setUnbanReasons(e.target.value); setError(""); }}
              placeholder="Descreva o motivo pelo qual o banimento está sendo removido…"
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-on-surface-variant text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none resize-none focus:ring-2 focus:ring-success transition-all"
            />
          </div>

          <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-xs text-on-surface-variant">
            <p className="font-semibold text-success mb-1">Ao confirmar o desbanimento:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>O estudante poderá criar uma nova sessão no sistema</li>
              <li>O CPF e e-mail serão removidos da lista de restrições</li>
              <li>O motivo do desbanimento ficará registrado para auditoria</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !unbanReasons.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-success text-white hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {loading ? "Removendo..." : "Confirmar Desbanimento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
