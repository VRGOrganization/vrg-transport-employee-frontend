"use client";

import { useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldShell } from "@/components/ui/FieldShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/lib/toast";
import { noticeService } from "@/services/noticeService";
import type { CreateNoticeInput, Notice, NoticeType } from "@/services/noticeService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (notice: Notice) => void;
}

const MIN_EXPIRES_DAYS = 1;
const MAX_EXPIRES_DAYS = 30;
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
    if (!Number.isInteger(days) || days < MIN_EXPIRES_DAYS || days > MAX_EXPIRES_DAYS) {
      return `O prazo deve ser entre ${MIN_EXPIRES_DAYS} e ${MAX_EXPIRES_DAYS} dias.`;
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
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === "message" ? "primary" : "outline"}
            size="sm"
            onClick={() => setType("message")}
          >
            Mensagem
          </Button>
          <Button
            type="button"
            variant={type === "poll" ? "primary" : "outline"}
            size="sm"
            onClick={() => setType("poll")}
          >
            Enquete
          </Button>
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
            <label className="flex items-center gap-2 text-sm mt-3">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
              />
              Permitir múltiplas escolhas
            </label>
          </FieldShell>
        )}

        <FieldShell label="Expira em (dias)" required>
          <Input
            aria-label="Expira em (dias)"
            type="number"
            min={MIN_EXPIRES_DAYS}
            max={MAX_EXPIRES_DAYS}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
          />
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
