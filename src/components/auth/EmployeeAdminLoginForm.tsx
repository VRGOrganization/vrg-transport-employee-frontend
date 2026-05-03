"use client";

import { useState } from "react";
import { ArrowRight, Lock, Hash } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useEmployeeAuth } from "../hooks/useEmployeeAuth";
import {
  employeeLoginRequestSchema,
  getFieldErrors,
} from "@/lib/validation/auth";
import Link from "next/link";

export function EmployeeAdminLoginForm() {
  const { login, loading } = useEmployeeAuth();
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    rememberMe: false,
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

    const result = await login({
      login: formData.login,
      password: formData.password,
      role: formData.role,
    });

    if (!result.success) {
      setErrors((prev) => ({
        ...prev,
        general: result.error ?? "Credenciais inválidas",
      }));
    }
  };

  return (
    <div className="space-y-5">
      {errors.general && (
        <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3">
          {errors.general}
        </div>
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
                onClick={() => setFormData({ ...formData, role: r })}
                className={[
                  "h-10 rounded-lg text-sm font-semibold transition-all duration-150",
                  formData.role === r
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
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
          />
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) =>
              setFormData({ ...formData, rememberMe: e.target.checked })
            }
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