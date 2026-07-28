"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileJson, FileText, Sheet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditDownloadFormat } from "@/lib/auditDownload";

interface DownloadFormatMenuProps {
  onPick: (format: AuditDownloadFormat) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const OPTIONS: {
  format: AuditDownloadFormat;
  label: string;
  icon: typeof FileJson;
}[] = [
  { format: "pdf", label: "PDF", icon: FileText },
  { format: "csv", label: "CSV (planilha)", icon: Sheet },
  { format: "json", label: "JSON", icon: FileJson },
];

/**
 * Botão "Baixar" que abre um menu para o usuário escolher o formato
 * (JSON / PDF / CSV) antes de exportar.
 */
export function DownloadFormatMenu({
  onPick,
  disabled = false,
  label = "Baixar",
  className,
}: DownloadFormatMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <Download className="size-4" />
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 min-w-44 rounded-xl bg-surface-container-lowest ring-1 ring-outline/30 shadow-xl p-1 z-20"
        >
          <p className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-on-surface-variant">
            Formato
          </p>
          {OPTIONS.map(({ format, label: optLabel, icon: Icon }) => (
            <button
              key={format}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPick(format);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <Icon className="size-4 text-on-surface-variant" />
              {optLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
