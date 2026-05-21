"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, Lock, Hash } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useEmployeeAuth } from "../hooks/useEmployeeAuth";
import {
  employeeLoginRequestSchema,
  getFieldErrors,
} from "@/lib/validation/auth";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export function EmployeeAdminLoginForm() {
  const { login } = useEmployeeAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const loginInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { loginInputRef.current?.focus(); }, []);
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    role: "employee" as "admin" | "employee",
  });
  const [errors, setErrors] = useState({
    login: "",
    password: "",
    role: "",
    general: "",
  });

  const validateForm = () => {
    const result = employeeLoginRequestSchema.safeParse(formData);

    if (result.success) {
      setErrors({ login: "", password: "", role: "", general: "" });
      return true;
    }

    const fieldErrors = getFieldErrors(result.error);
    setErrors({
      login: fieldErrors.login ?? "",
      password: fieldErrors.password ?? "",
      role: fieldErrors.role ?? "",
      general: "",
    });
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setRateLimited(false);
    setSubmitting(true);

    const result = await login({
      login: formData.login,
      password: formData.password,
      role: formData.role,
    });

    setSubmitting(false);

    if (!result.success) {
      setRateLimited(result.rateLimited ?? false);
      setErrors((prev) => ({
        ...prev,
        general: result.error ?? "Credenciais inválidas",
      }));
    }
  };

  return (
    <div className="space-y-5">
      <div role="alert" aria-live="polite" aria-atomic="true">
        {errors.general && (
          <div
            className={[
              "text-sm rounded-xl px-4 py-3",
              rateLimited
                ? "bg-primary/10 border border-primary/25 text-primary"
                : "bg-error-container border border-error-border text-error",
            ].join(" ")}
          >
            {errors.general}
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
                aria-pressed={formData.role === r}
                onClick={() => setFormData({ ...formData, role: r })}
                className={[
                  "h-10 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer border-2",
                  formData.role === r
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
            ref={loginInputRef}
            id="login-field"
            type="text"
            autoComplete="username"
            icon={<Hash size={18} />}
            placeholder="email@dominio.com ou MAT123456"
            value={formData.login}
            onChange={(e) =>
              setFormData({ ...formData, login: e.target.value })
            }
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
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-primary hover:underline font-medium"
            >
              Esqueci minha senha
            </button>
          </div>
          <Input
            id="password-field"
            type="password"
            autoComplete="current-password"
            icon={<Lock size={18} />}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          loading={submitting || rateLimited}
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