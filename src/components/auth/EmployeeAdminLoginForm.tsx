"use client";

import { useState } from "react";
import { ArrowRight, Badge, Lock } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useEmployeeAuth } from "../hooks/useEmployeeAuth";
import { employeeLoginRequestSchema, getFieldErrors } from "@/lib/validation/auth";


export function EmployeeAdminLoginForm() {
  const { login, loading } = useEmployeeAuth();
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    role: "employee" as "admin" | "employee",
  });
  const [errors, setErrors] = useState({ login: "", password: "", role: "", general: "" });

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
      setErrors((prev) => ({ ...prev, general: result.error ?? "Credenciais inválidas" }));
    }
  };

  return (
    <div className="space-y-6">
      {errors.general && (
        <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            Perfil de acesso
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as "admin" | "employee",
              })
            }
            className="h-12 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="employee">Funcionário</option>
            <option value="admin">Administrador</option>
          </select>
          {errors.role && (
            <p className="text-xs text-error ml-1">{errors.role}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            Matrícula
          </label>
          <Input
            type="text"
            icon={<Badge size={20} />}
            placeholder="email@dominio.com ou MAT123456"
            value={formData.login}
            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
            error={errors.login}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            Senha
          </label>
          <Input
            type="password"
            icon={<Lock size={20} />}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          loading={loading}
          icon={<ArrowRight size={20} />}
        >
          Acessar Sistema
        </Button>
      </form>

      <div className="mt-8 p-4 bg-surface-container-low rounded-xl">
        <p className="text-xs text-center text-on-surface-variant">
           Apenas funcionários e administradores têm acesso.<br />
          Contas de estudante não podem acessar este portal.
        </p>
      </div>
    </div>
  );
}