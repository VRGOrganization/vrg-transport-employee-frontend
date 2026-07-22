"use client";

import { useState } from "react";
import { ArrowRight, Lock, Hash } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useEmployeeAuth } from "../hooks/useEmployeeAuth";
import { useZodForm } from "@/components/hooks/useZodForm";
import { employeeLoginRequestSchema } from "@/lib/validation/auth";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

type Role = "admin" | "employee";

export function EmployeeAdminLoginForm() {
  const { login } = useEmployeeAuth();
  const [rateLimited, setRateLimited] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { values, errors, generalError, loading, setValue, handleSubmit } = useZodForm({
    schema: employeeLoginRequestSchema,
    initialValues: { login: "", password: "", role: "employee" as Role },
    onSubmit: async (v) => {
      setRateLimited(false);
      const result = await login({ login: v.login, password: v.password, role: v.role });
      if (result.success) return { success: true as const };
      setRateLimited(result.rateLimited ?? false);
      return { success: false as const, error: result.error ?? "Credenciais inválidas" };
    },
  });

  return (
    <div className="space-y-5">
      {/* Erro geral — aria-live para leitores de tela */}
      <div role="alert" aria-live="polite" aria-atomic="true">
        {generalError && (
          <div
            className={[
              "text-sm rounded-xl px-4 py-3",
              rateLimited
                ? "bg-primary/10 border border-primary/25 text-primary"
                : "bg-error-container border border-error-border text-error",
            ].join(" ")}
          >
            {generalError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Perfil de acesso — toggle buttons */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Perfil de acesso
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container rounded-xl">
            {(["employee", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={values.role === r}
                onClick={() => setValue("role", r)}
                className={[
                  "h-10 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer border-2",
                  values.role === r
                    ? "bg-primary text-on-primary shadow-sm border-primary"
                    : "text-on-surface-variant hover:text-on-surface border-outline-variant",
                ].join(" ")}
              >
                {r === "employee" ? "Funcionário" : "Administrador"}
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="text-xs text-error ml-1">{errors.role}</p>
          )}
        </div>

        {/* Matrícula ou E-mail */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-field"
            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
          >
            Matrícula ou E-mail
          </label>
          <Input
            id="login-field"
            type="text"
            autoComplete="username"
            icon={<Hash size={18} />}
            placeholder="email@dominio.com ou MAT123456"
            value={values.login}
            onChange={(e) => setValue("login", e.target.value)}
            error={errors.login}
          />
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password-field"
              className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
            >
              Senha
            </label>
            {values.role === "employee" && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Esqueci minha senha
              </button>
            )}
          </div>
          <Input
            id="password-field"
            type="password"
            autoComplete="current-password"
            icon={<Lock size={18} />}
            placeholder="••••••••"
            value={values.password}
            onChange={(e) => setValue("password", e.target.value)}
            error={errors.password}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          loading={loading}
          icon={<ArrowRight size={20} />}
        >
          Acessar sistema
        </Button>
      </form>

      {/* Footer note */}
      <div className="pt-4 border-t border-outline-variant">
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Acesso exclusivo para servidores. Estudantes devem usar o
          aplicativo móvel da Secretaria de Transportes.
        </p>
      </div>

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}
