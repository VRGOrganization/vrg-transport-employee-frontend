"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Tipos aceitos por documento comum (comprovantes): imagem ou PDF. */
const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";

/**
 * Tipos aceitos pela foto 3x4. A license-api só decodifica JPEG/PNG/WEBP
 * (`ALLOWED_PHOTO_FORMATS`) e recusa o resto com ERR003, então um PDF aqui só
 * quebraria na hora de gerar a carteirinha.
 */
const ACCEPTED_IMAGE_ONLY = "image/jpeg,image/png,image/webp";

interface DocumentUploadFieldProps {
  label: string;
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  /** Restringe o campo a imagens (sem PDF) — usado na foto 3x4. */
  imageOnly?: boolean;
}

/**
 * Card de upload de um documento (imagem ou PDF), reutilizável no cadastro
 * interno do aluno e no wizard interno de carteirinha. Aceita os mesmos tipos
 * validados pelo backend (jpeg/png/webp/pdf); com `imageOnly`, apenas imagens.
 */
export function DocumentUploadField({
  label,
  hint,
  value,
  onChange,
  required = false,
  imageOnly = false,
}: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [typeError, setTypeError] = useState("");
  const accepted = imageOnly ? ACCEPTED_IMAGE_ONLY : ACCEPTED;

  /**
   * O `accept` é só uma dica do seletor de arquivos: o usuário ainda pode
   * escolher "todos os arquivos" e mandar um PDF. Por isso o tipo é validado de
   * novo aqui, antes de guardar o arquivo no formulário.
   */
  const handleSelect = (file: File | null) => {
    if (file && imageOnly && !ACCEPTED_IMAGE_ONLY.split(",").includes(file.type)) {
      setTypeError("Envie uma imagem JPEG, PNG ou WEBP. PDF não é aceito na foto 3x4.");
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setTypeError("");
    onChange(file);
  };

  return (
    <div className="space-y-1">
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        typeError
          ? "border-error bg-error/5"
          : value
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
              setTypeError("");
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
        accept={accepted}
        className="hidden"
        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
      />
    </div>
      {typeError && <p className="text-xs text-error ml-1">{typeError}</p>}
    </div>
  );
}
