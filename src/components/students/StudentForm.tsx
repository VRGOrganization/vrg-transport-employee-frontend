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


      
      {/* CPF */}
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

      {/* Info message — only on create */}
      {!isEdit && (
        <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant">
          <p className="text-xs text-on-surface-variant italic">
            * Por motivos de segurança, a senha não é definida pelo administrador. 
            O estudante receberá um e-mail de boas-vindas com um link para definir sua própria senha 
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
        icon={isEdit ? "save" : ""}
      >
        {isEdit ? "Salvar alterações" : "Cadastrar Estudante"}
      </Button>
    </form>
  );
}