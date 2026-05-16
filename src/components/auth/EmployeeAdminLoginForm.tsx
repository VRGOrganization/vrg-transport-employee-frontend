"use client";

import { useState } from "react";
import { ArrowRight, Lock, Hash } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useEmployeeAuth } from "../hooks/useEmployeeAuth";
import { useZodForm } from "@/components/hooks/useZodForm";
import { employeeLoginRequestSchema } from "@/lib/validation/auth";
import Link from "next/link";

type Role = "admin" | "employee";

export function EmployeeAdminLoginForm() {
  const { login } = useEmployeeAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const { values, errors, generalError, loading, setValue, handleSubmit } = useZodForm({
    schema: employeeLoginRequestSchema,
    initialValues: { login: "", password: "", role: "employee" as Role },
    onSubmit: async (v) => {
      const result = await login({ login: v.login, password: v.password, role: v.role });
      if (result.success) return { success: true as const };
      return { success: false as const, error: result.error ?? "Credenciais inválidas" };
    },
  });

  return (
    <div className="space-y-5">
      {generalError && (
        <StatusBanner variant="error">{generalError}</StatusBanner>
      )}

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
                onClick={() => setValue("role", r)}
                className={[
                  "h-10 rounded-lg text-sm font-semibold transition-all duration-150",
                  values.role === r
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
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
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Matrícula ou E-mail
          </label>
          <Input
            type="text"
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
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Senha
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            type="password"
            icon={<Lock size={18} />}
            placeholder="••••••••"
            value={values.password}
            onChange={(e) => setValue("password", e.target.value)}
            error={errors.password}
          />
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-outline accent-primary cursor-pointer"
          />
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            Manter conectado neste computador
          </span>
        </label>

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
    </div>
  );
}