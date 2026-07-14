"use client";

import { useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldShell } from "@/components/ui/FieldShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { noticeService } from "@/services/noticeService";
import type { CreateNoticeInput, Notice, NoticeType } from "@/services/noticeService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (notice: Notice) => void;
}

const EXPIRES_DAYS_OPTIONS = [1, 3, 7, 15, 30] as const;
const MIN_POLL_OPTIONS = 2;

export function CreateNoticeModal({ open, onClose, onCreated }: Props) {
  const [type, setType] = useState<NoticeType>("message");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setType("message");
    setTitle("");
    setBody("");
    setPollOptions(["", ""]);
    setAllowMultiple(false);
    setExpiresInDays("7");
    setError("");
    setConfirming(false);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = (): string | null => {
    const days = Number(expiresInDays);
    if (!EXPIRES_DAYS_OPTIONS.includes(days as (typeof EXPIRES_DAYS_OPTIONS)[number])) {
      return "Escolha um prazo de expiração válido.";
    }
    if (type === "poll") {
      const filled = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (filled.length < MIN_POLL_OPTIONS) {
        return "A enquete precisa de pelo menos 2 opções.";
      }
    }
    return null;
  };

  const handleRequestSubmit = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setConfirming(true);
  };

  const buildInput = (): CreateNoticeInput => {
    const base = { type, title, expiresInDays: Number(expiresInDays) };
    if (type === "poll") {
      return {
        ...base,
        pollOptions: pollOptions.map((o) => o.trim()).filter(Boolean),
        allowMultiple,
      };
    }
    return { ...base, body };
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const notice = await noticeService.createNotice(buildInput());
      toast.success("Aviso criado com sucesso.");
      onCreated(notice);
      handleClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao criar aviso");
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addPollOption = () => setPollOptions((prev) => [...prev, ""]);

  const removePollOption = (index: number) => {
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  if (confirming) {
    return (
      <ConfirmModal
        open
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirmSubmit}
        loading={loading}
        error={error}
        title="Publicar este aviso?"
        icon={Send}
        variant="warning"
        description="O aviso ficará 25s em janela de desfazer antes de publicar de verdade."
        confirmLabel="Sim, publicar"
      />
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo aviso" size="md">
      <div className="space-y-4">
        <div
          role="radiogroup"
          aria-label="Tipo de aviso"
          className="inline-flex rounded-xl border border-on-surface-variant overflow-hidden"
        >
          <button
            type="button"
            role="radio"
            aria-checked={type === "message"}
            onClick={() => setType("message")}
            className={cn(
              "px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
              type === "message"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            Mensagem
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={type === "poll"}
            onClick={() => setType("poll")}
            className={cn(
              "px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-l border-on-surface-variant",
              type === "poll"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            Enquete
          </button>
        </div>

        <FieldShell label={type === "poll" ? "Pergunta" : "Título"} required>
          <Input
            aria-label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FieldShell>

        {type === "message" && (
          <FieldShell label="Mensagem">
            <textarea
              aria-label="Mensagem"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-28 bg-surface-container-lowest border border-on-surface-variant rounded-xl p-3 text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </FieldShell>
        )}

        {type === "poll" && (
          <FieldShell label="Opções" required>
            <div className="space-y-2">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    aria-label={`Opção ${index + 1}`}
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                  />
                  {pollOptions.length > MIN_POLL_OPTIONS && (
                    <button
                      type="button"
                      aria-label="Remover opção"
                      onClick={() => removePollOption(index)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus className="size-4" />}
                onClick={addPollOption}
              >
                Adicionar opção
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 mt-3 px-3 py-2.5 rounded-xl border border-on-surface-variant">
              <span id="allow-multiple-label" className="text-sm text-on-surface">
                Permitir múltiplas escolhas
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={allowMultiple}
                aria-labelledby="allow-multiple-label"
                onClick={() => setAllowMultiple((v) => !v)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer",
                  allowMultiple ? "bg-primary" : "bg-surface-container-high border border-on-surface-variant",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-block size-4 transform rounded-full bg-white transition-transform",
                    allowMultiple ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
            </div>
          </FieldShell>
        )}

        <FieldShell label="Expira em" required>
          <div className="flex flex-wrap gap-2">
            {EXPIRES_DAYS_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={Number(expiresInDays) === days}
                onClick={() => setExpiresInDays(String(days))}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer",
                  Number(expiresInDays) === days
                    ? "bg-primary text-white border-primary"
                    : "border-on-surface-variant text-on-surface-variant hover:bg-surface-container-high",
                )}
              >
                {days} {days === 1 ? "dia" : "dias"}
              </button>
            ))}
          </div>
        </FieldShell>

        {error && <p className="text-sm text-error">{error}</p>}

        <Button
          type="button"
          fullWidth
          icon={<Send className="size-4" />}
          onClick={handleRequestSubmit}
        >
          Enviar
        </Button>
      </div>
    </Modal>
  );
}
