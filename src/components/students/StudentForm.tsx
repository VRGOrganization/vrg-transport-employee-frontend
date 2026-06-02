"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SelectField } from "@/components/ui/SelectField";
import { SHIFTS, BLOOD_TYPES, StudentFormData, StudentFormErrors } from "@/types/student";

interface University {
  _id: string;
  name: string;
  acronym: string;
}

interface StudentFormProps {
  data: StudentFormData;
  errors: StudentFormErrors;
  loading: boolean;
  mode: "create" | "edit";
  onChange: (field: keyof StudentFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  universities?: University[];
  loadingUniversities?: boolean;
}

const LABEL_CLASS =
  "text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1";

export function StudentForm({
  data,
  errors,
  loading,
  mode,
  onChange,
  onSubmit,
  universities = [],
  loadingUniversities = false,
}: StudentFormProps) {
  const isEdit = mode === "edit";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {errors.general && (
        <StatusBanner variant="error">{errors.general}</StatusBanner>
      )}

      <Input
        label="Nome completo"
        type="text"
        icon="person"
        placeholder="Maria da Silva"
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
        error={errors.name}
      />

      <Input
        label="Email"
        type="email"
        icon="mail"
        placeholder="aluno@email.com"
        value={data.email}
        onChange={(e) => onChange("email", e.target.value)}
        error={errors.email}
        disabled={isEdit}
      />

      <Input
        label="Telefone"
        type="tel"
        icon="phone"
        placeholder="(22) 99999-9999"
        value={data.telephone}
        onChange={(e) => onChange("telephone", e.target.value)}
        error={errors.telephone}
      />

      <Input
        label="Curso / Graduação (opcional)"
        type="text"
        icon="school"
        placeholder="Ex: Engenharia de Software"
        value={data.degree}
        onChange={(e) => onChange("degree", e.target.value)}
        error={errors.degree}
      />

      <SelectField
        label="Turno (opcional)"
        icon="schedule"
        options={SHIFTS}
        placeholder="Selecione o turno"
        value={data.shift}
        onChange={(e) => onChange("shift", e.target.value)}
        error={errors.shift}
      />

      <SelectField
        label="Tipo Sanguíneo (opcional)"
        options={BLOOD_TYPES.map((bt) => ({ value: bt, label: bt }))}
        placeholder="Não informado"
        value={data.bloodType}
        onChange={(e) => onChange("bloodType", e.target.value)}
        error={errors.bloodType}
      />

      <div className="space-y-2">
        <label className={LABEL_CLASS}>Instituição de Ensino (opcional)</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary pointer-events-none text-2xl transition-colors">
            apartment
          </span>
          <input
            list="universities-datalist"
            value={data.institution}
            onChange={(e) => onChange("institution", e.target.value)}
            placeholder={loadingUniversities ? "Carregando…" : "Nome da instituição"}
            className="w-full h-14 bg-surface-container-lowest border border-on-surface-variant ring-0 focus:ring-2 focus:ring-primary rounded-xl text-on-surface pl-12 pr-4 text-base outline-none transition-all placeholder:text-outline/50"
          />
          <datalist id="universities-datalist">
            {universities.map((u) => (
              <option key={u._id} value={u.name} />
            ))}
          </datalist>
        </div>
        {errors.institution && (
          <p className="text-xs text-error mt-1 ml-1">{errors.institution}</p>
        )}
      </div>

      <Input
        label="CPF (apenas números)"
        type="text"
        icon="badge"
        placeholder="12345678909"
        value={data.cpf}
        onChange={(e) => onChange("cpf", e.target.value)}
        error={errors.cpf}
        disabled={isEdit}
      />

      {!isEdit && (
        <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant">
          <p className="text-xs text-on-surface-variant italic">
            * Por motivos de segurança, a senha não é definida pelo administrador.
            O estudante receberá um e-mail com link para definir a própria senha
            assim que o cadastro for concluído.
          </p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        icon={isEdit ? <Save className="size-4" /> : undefined}
      >
        {isEdit ? "Salvar alterações" : "Cadastrar Estudante"}
      </Button>
    </form>
  );
}
