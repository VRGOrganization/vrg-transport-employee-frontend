"use client";

import { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useEmployeeAuth } from "../hooks/useEmployeeAuth";


export function EmployeeAdminLoginForm() {
  const { login, loading } = useEmployeeAuth();
  const [formData, setFormData] = useState({ login: "", password: "" });
  const [errors, setErrors] = useState({ login: "", password: "", general: "" });

  const validateForm = () => {
    const newErrors = { login: "", password: "", general: "" };
    let isValid = true;

    if (!formData.login) {
      newErrors.login = "Email ou matrícula é obrigatório";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await login({
      login: formData.login,
      password: formData.password,
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
          Matrícula
          </label>
          <Input
            type="text"
            icon="badge"
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
            icon="lock"
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
          icon="arrow_forward"
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