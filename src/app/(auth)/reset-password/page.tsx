"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, CheckCircle2 } from "lucide-react";

import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { resetPasswordSchema } from "@/lib/validation/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors]         = useState<Record<string, string>>({});
  const [serverError, setServerError]         = useState("");
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError("");

    const result = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (field && !errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setServerError(data.message ?? "Muitas tentativas. Tente novamente em 1 hora.");
        return;
      }

      if (!res.ok) {
        setServerError(data.message ?? "Não foi possível redefinir a senha. O link pode ter expirado.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthPageShell eyebrow="Acesso" title="Senha redefinida!" topRight={<ThemeToggle />}>
        <div className="flex flex-col items-center text-center gap-5 py-4">
          <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <p className="text-sm text-on-surface-variant max-w-xs">
            Sua senha foi redefinida com sucesso. Você já pode fazer login com a nova senha.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => router.push("/login")}
          >
            Ir para o login
          </Button>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Acesso"
      title="Redefinir senha"
      subtitle="Crie uma nova senha para sua conta."
      topRight={<ThemeToggle />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="password"
          label="Nova senha"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
          }}
          error={fieldErrors.password}
          disabled={loading}
          icon={<KeyRound size={18} />}
        />

        <Input
          type="password"
          label="Confirmar nova senha"
          placeholder="Repita a nova senha"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword)
              setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
          }}
          error={fieldErrors.confirmPassword}
          disabled={loading}
          icon={<KeyRound size={18} />}
        />

        <p className="text-xs text-on-surface-variant">
          A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.
        </p>

        {serverError && (
          <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3">
            {serverError}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" variant="secondary" size="lg" fullWidth loading={loading}>
            Redefinir senha
          </Button>
          <button
            type="button"
            onClick={() => router.push("/login")}
            disabled={loading}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors py-1 disabled:opacity-40"
          >
            Voltar ao login
          </button>
        </div>
      </form>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
