"use client";

import { useState } from "react";
import { Mail, MailCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { forgotPasswordSchema } from "@/lib/validation/auth";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail]           = useState("");
  const [step, setStep]             = useState<"form" | "success">("form");
  const [loading, setLoading]       = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");

  function handleClose() {
    if (loading) return;
    onClose();
    setTimeout(() => {
      setEmail("");
      setStep("form");
      setFieldError("");
      setServerError("");
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError("");
    setServerError("");

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Email inválido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.data.email }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setServerError(data.message ?? "Muitas tentativas. Tente novamente em breve.");
        return;
      }

      if (!res.ok && res.status !== 200) {
        const data = await res.json().catch(() => ({}));
        setServerError(data.message ?? "Não foi possível processar a solicitação.");
        return;
      }

      setStep("success");
    } catch {
      setServerError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : handleClose}
      title={
        <span className="flex items-center gap-3">
          <span className="size-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Mail className="size-5 text-primary" />
          </span>
          <span className="text-base">Recuperar senha</span>
        </span>
      }
    >
      {step === "form" ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-on-surface-variant">
            Informe o email cadastrado e enviaremos um link para você redefinir sua senha.
          </p>

          <Input
            type="email"
            icon={<Mail size={18} />}
            placeholder="email@dominio.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError("");
            }}
            error={fieldError}
            disabled={loading}
            autoFocus
          />

          {serverError && <StatusBanner variant="error">{serverError}</StatusBanner>}

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Enviar link de recuperação
            </Button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors py-1 disabled:opacity-40"
            >
              Voltar ao login
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center">
            <MailCheck className="size-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-on-surface">Email enviado!</h3>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Se o email{" "}
              <span className="font-medium text-on-surface">{email}</span>{" "}
              estiver cadastrado, você receberá um link de recuperação em breve.
            </p>
            <p className="text-xs text-on-surface-variant/70 pt-1">
              Verifique também a pasta de spam.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={handleClose}
            className="mt-2"
          >
            Fechar
          </Button>
        </div>
      )}
    </Modal>
  );
}
