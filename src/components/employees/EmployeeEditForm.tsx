"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { employeeEditSchema } from "@/lib/validation/employee";
import type { Employee } from "@/types/employee";

export interface ChangeEntry {
  label: string;
  from: string;
  to: string;
}

interface Props {
  employee: Employee;
  generalError?: string;
  /** Esconde o cabeçalho interno (ícone de voltar + título) para quando o
   * formulário já vive dentro de uma página com seu próprio cabeçalho. O
   * botão "Cancelar" do rodapé continua chamando onCancel normalmente. */
  hideHeader?: boolean;
  onCancel: () => void;
  onPrepareConfirm: (payload: Record<string, string>, changes: ChangeEntry[]) => void;
}

export function EmployeeEditForm({ employee, generalError, hideHeader, onCancel, onPrepareConfirm }: Props) {
  const [values, setValues] = useState({
    name: employee.name,
    email: employee.email,
    registrationId: employee.registrationId,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = employeeEditSchema.safeParse(values);
    if (!result.success) {
      const fe: Record<string, string> = {};
      for (const [k, v] of Object.entries(result.error.flatten().fieldErrors)) {
        if (v?.[0]) fe[k] = v[0];
      }
      setFieldErrors(fe);
      return;
    }

    const data = result.data;
    const payload: Record<string, string> = {};
    const changes: ChangeEntry[] = [];

    if (data.name.trim() !== employee.name) {
      payload.name = data.name.trim();
      changes.push({ label: "Nome", from: employee.name, to: data.name.trim() });
    }
    if (data.email.trim().toLowerCase() !== employee.email) {
      payload.email = data.email.trim().toLowerCase();
      changes.push({ label: "Email", from: employee.email, to: data.email.trim().toLowerCase() });
    }
    if (data.registrationId.trim() !== employee.registrationId) {
      payload.registrationId = data.registrationId.trim();
      changes.push({ label: "Matrícula", from: employee.registrationId, to: data.registrationId.trim() });
    }
    if (changes.length === 0) {
      setFieldErrors({ _form: "Nenhuma alteração foi feita" });
      return;
    }

    onPrepareConfirm(payload, changes);
  };

  return (
    <>
      {!hideHeader && (
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h3 className="font-headline font-semibold text-lg text-on-surface flex-1">Editar Funcionário</h3>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {(generalError || fieldErrors._form) && (
          <StatusBanner variant="error">{generalError ?? fieldErrors._form}</StatusBanner>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            Nome completo
          </label>
          <Input type="text" icon="person" value={values.name} onChange={set("name")} error={fieldErrors.name} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            Email
          </label>
          <Input type="email" icon="mail" value={values.email} onChange={set("email")} error={fieldErrors.email} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            Matrícula
          </label>
          <Input
            type="text"
            icon="badge"
            value={values.registrationId}
            onChange={set("registrationId")}
            error={fieldErrors.registrationId}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" fullWidth onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" fullWidth icon={<Check className="size-4" />}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </>
  );
}
