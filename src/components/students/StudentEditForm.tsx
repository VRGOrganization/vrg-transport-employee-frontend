"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { studentEditSchema } from "@/lib/validation/student";
import { SHIFTS, BLOOD_TYPES } from "@/types/student";
import { formatPhone } from "@/lib/formatters";
import type { Student } from "@/types/student";
import type { University } from "@/types/university.types";
import type { ChangeEntry } from "@/components/students/StudentEditConfirmView";

interface Props {
  student: Student;
  universities: University[];
  loadingUniversities: boolean;
  generalError?: string;
  /** Esconde o cabeçalho interno (ícone de voltar + título) para quando o
   * formulário já vive dentro de uma página com seu próprio cabeçalho. O
   * botão "Cancelar" do rodapé continua chamando onCancel normalmente. */
  hideHeader?: boolean;
  onCancel: () => void;
  onPrepareConfirm: (payload: Record<string, string>, changes: ChangeEntry[]) => void;
}

export function StudentEditForm({
  student,
  universities,
  loadingUniversities,
  generalError,
  hideHeader,
  onCancel,
  onPrepareConfirm,
}: Props) {
  const [values, setValues] = useState({
    name: student.name,
    socialName: student.socialName ?? "",
    telephone: student.telephone,
    institution: student.institution ?? "",
    shift: student.shift ?? "",
    bloodType: student.bloodType ?? "",
    degree: student.degree ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof values) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = studentEditSchema.safeParse(values);
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

    const diff = (
      field: keyof typeof values,
      label: string,
      newValue: string,
      originalValue: string,
    ) => {
      if (newValue !== originalValue) {
        payload[field] = newValue;
        changes.push({ label, from: originalValue || "—", to: newValue || "—" });
      }
    };

    diff("name", "Nome", data.name.trim(), student.name);
    diff("socialName", "Nome social", (data.socialName ?? "").trim(), student.socialName ?? "");
    diff("telephone", "Telefone", data.telephone.trim(), student.telephone);
    diff("institution", "Instituição", (data.institution ?? "").trim(), student.institution ?? "");
    diff("degree", "Curso", (data.degree ?? "").trim(), student.degree ?? "");
    diff("shift", "Turno", data.shift ?? "", student.shift ?? "");
    diff("bloodType", "Tipo sanguíneo", data.bloodType ?? "", student.bloodType ?? "");

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
          <h3 className="font-headline font-semibold text-lg text-on-surface flex-1">Editar Estudante</h3>
        </div>
      )}

      <p className="text-xs text-on-surface-variant mb-5">
        E-mail: <span className="font-medium text-on-surface">{student.email}</span> · não pode ser
        alterado por aqui.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(generalError || fieldErrors._form) && (
          <StatusBanner variant="error">{generalError ?? fieldErrors._form}</StatusBanner>
        )}

        <Input
          label="Nome completo"
          type="text"
          icon="person"
          value={values.name}
          onChange={set("name")}
          error={fieldErrors.name}
        />

        <Input
          label="Nome social (opcional)"
          type="text"
          icon="badge"
          placeholder="Como o(a) aluno(a) prefere ser chamado(a)"
          value={values.socialName}
          onChange={set("socialName")}
          error={fieldErrors.socialName}
        />

        <Input
          label="Telefone"
          type="tel"
          icon="phone"
          value={formatPhone(values.telephone)}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              telephone: e.target.value.replace(/\D/g, "").slice(0, 11),
            }))
          }
          error={fieldErrors.telephone}
        />

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            Instituição de Ensino (opcional)
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary pointer-events-none text-2xl transition-colors">
              apartment
            </span>
            <input
              list="student-edit-universities"
              value={values.institution}
              onChange={set("institution")}
              placeholder={loadingUniversities ? "Carregando…" : "Nome da instituição"}
              className="w-full h-14 bg-surface-container-lowest border border-on-surface-variant ring-0 focus:ring-2 focus:ring-primary rounded-xl text-on-surface pl-12 pr-4 text-base outline-none transition-all placeholder:text-outline/50"
            />
            <datalist id="student-edit-universities">
              {universities.map((u) => (
                <option key={u._id} value={u.name} />
              ))}
            </datalist>
          </div>
          {fieldErrors.institution && (
            <p className="text-xs text-error mt-1 ml-1">{fieldErrors.institution}</p>
          )}
        </div>

        <Input
          label="Curso / Graduação (opcional)"
          type="text"
          icon="school"
          value={values.degree}
          onChange={set("degree")}
          error={fieldErrors.degree}
        />

        <SelectField
          label="Turno (opcional)"
          icon="schedule"
          options={SHIFTS}
          placeholder="Selecione o turno"
          value={values.shift}
          onChange={set("shift")}
          error={fieldErrors.shift}
        />

        <SelectField
          label="Tipo Sanguíneo (opcional)"
          options={BLOOD_TYPES.map((bt) => ({ value: bt, label: bt }))}
          placeholder="Não informado"
          value={values.bloodType}
          onChange={set("bloodType")}
          error={fieldErrors.bloodType}
        />

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
