"use client";

import { useEffect, useState } from "react";
import { X, Mail, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-base text-on-surface">
              Recuperar senha
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
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

              {serverError && (
                <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3">
                  {serverError}
                </div>
              )}

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
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MailCheck className="w-8 h-8 text-primary" />
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
        </div>
      </div>
    </div>
  );
}
