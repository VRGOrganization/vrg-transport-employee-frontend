"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  StudentFormData,
  StudentFormErrors,
} from "@/types/student";

interface StudentFormProps {
  data: StudentFormData;
  errors: StudentFormErrors;
  loading: boolean;
  mode: "create" | "edit";
  onChange: (field: keyof StudentFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function StudentForm({
  data,
  errors,
  loading,
  mode,
  onChange,
  onSubmit,
}: StudentFormProps) {
  const isEdit = mode === "edit";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* General error */}
      {errors.general && (
        <div className="bg-error-container border border-error/20 text-error text-sm rounded-xl px-4 py-3">
          {errors.general}
        </div>
      )}

      {/* Name */}
      <Input
        label="Nome completo"
        type="text"
        icon="person"
        placeholder="Maria da Silva"
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
        error={errors.name}
      />

      {/* Email */}
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

      {/* Telephone */}
      <Input
        label="Telefone"
        type="tel"
        icon="phone"
        placeholder="(22) 99999-9999"
        value={data.telephone}
        onChange={(e) => onChange("telephone", e.target.value)}
        error={errors.telephone}
      />


      

      {/* Password fields — only on create */}
      {!isEdit && (
        <>
          <Input
            label="Senha"
            type="password"
            icon="lock"
            placeholder="••••••••"
            value={data.password}
            onChange={(e) => onChange("password", e.target.value)}
            error={errors.password}
          />
          <p className="text-xs text-on-surface-variant -mt-3 ml-1">
            Mínimo 8 caracteres com maiúsculas, minúsculas e números
          </p>

          <Input
            label="Confirmar senha"
            type="password"
            icon="lock"
            placeholder="••••••••"
            value={data.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
          />
        </>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        icon={isEdit ? "save" : "person_add"}
      >
        {isEdit ? "Salvar alterações" : "Cadastrar Estudante"}
      </Button>
    </form>
  );
}