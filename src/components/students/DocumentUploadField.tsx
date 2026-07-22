"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";

interface DocumentUploadFieldProps {
  label: string;
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}

/**
 * Card de upload de um documento (imagem ou PDF), reutilizável no cadastro
 * interno do aluno e no wizard interno de carteirinha. Aceita os mesmos tipos
 * validados pelo backend (jpeg/png/webp/pdf).
 */
export function DocumentUploadField({
  label,
  hint,
  value,
  onChange,
  required = false,
}: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        value
          ? "border-primary/30 bg-primary/5"
          : "border-outline-variant border-dashed bg-surface-container-lowest",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center size-10 rounded-lg",
          value ? "bg-primary/15 text-primary" : "bg-surface-container text-outline",
        )}
      >
        <span className="material-symbols-outlined text-xl">
          {value ? "task" : "upload_file"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant truncate">
          {label}
          {required && <span className="text-error"> *</span>}
        </p>
        <p
          className={cn("text-sm truncate", value ? "text-on-surface" : "text-outline")}
          title={value?.name}
        >
          {value ? value.name : "Nenhum arquivo selecionado"}
        </p>
        {hint && !value && <p className="text-xs text-outline truncate">{hint}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          title={value ? "Trocar arquivo" : "Selecionar arquivo"}
          aria-label={value ? `Trocar ${label}` : `Selecionar ${label}`}
          className="flex items-center justify-center size-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">
            {value ? "sync" : "add"}
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            title="Remover arquivo"
            aria-label={`Remover ${label}`}
            className="flex items-center justify-center size-9 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
