"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, ShieldAlert, Ban } from "lucide-react";
import type { Bus } from "@/types/university.types";

interface DeactivateBusModalProps {
  bus: Bus | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function DeactivateBusModal({
  bus,
  onClose,
  onConfirm,
  loading,
  error,
}: DeactivateBusModalProps) {
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!bus) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [bus]);

  useEffect(() => {
    setInputValue("");
  }, [bus]);

  useEffect(() => {
    if (!bus) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [bus, loading, onClose]);

  if (!mounted || !bus) return null;

  const identifier = bus.identifier;
  const canConfirm = inputValue === identifier && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-md mx-4 bg-surface rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="bg-linear-to-r from-error to-error/80 px-6 py-8 flex flex-col items-center justify-center relative shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 text-white hover:bg-black/20 size-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>

          <div className="size-20 rounded-full bg-surface flex items-center justify-center shadow-lg border-4 border-surface mb-3">
            <Ban className="size-9 text-error" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight text-center">
            Desativar Ônibus
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {identifier}
            {bus.capacity != null && <> · {bus.capacity} vagas</>}
          </p>
        </div>

        {/* ── FORM ───────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

            <div className="flex items-start gap-3 p-4 rounded-xl bg-error/5 border border-error/20">
              <ShieldAlert className="size-5 text-error shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-error">Ação imediata</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Esta ação desativará o ônibus. Ele não aparecerá mais para novas alocações.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-error-container/60 text-error text-xs">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">
                Confirme o identificador do ônibus <span className="text-error">*</span>
              </label>
              <p className="text-[11px] text-on-surface-variant mb-1">
                Digite exatamente: <span className="font-bold text-on-surface select-all">{identifier}</span>
              </p>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={identifier}
                disabled={loading}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container border-2 border-error text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-error transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="px-8 py-4 bg-surface-container-low border-t border-outline-variant/20 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-error text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? <Loader2 className="size-4 animate-spin" />
                : <Ban className="size-4" />
              }
              {loading ? "Desativando..." : "Sim, desativar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
