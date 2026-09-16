"use client";

import { Download, FileJson, FileText, Sheet } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
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
  return (
    <Dropdown
      align="end"
      className={className}
      trigger={
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="size-4" />
          {label}
        </button>
      }
    >
      <p className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-on-surface-variant">
        Formato
      </p>
      {OPTIONS.map(({ format, label: optLabel, icon: Icon }) => (
        <button
          key={format}
          type="button"
          role="menuitem"
          onClick={() => onPick(format)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <Icon className="size-4 text-on-surface-variant" />
          {optLabel}
        </button>
      ))}
    </Dropdown>
  );
}
