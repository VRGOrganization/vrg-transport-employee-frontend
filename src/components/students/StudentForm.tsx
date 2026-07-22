"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SelectField } from "@/components/ui/SelectField";
import { DocumentUploadField } from "@/components/students/DocumentUploadField";
import {
  SHIFTS,
  BLOOD_TYPES,
  StudentFormData,
  StudentFormErrors,
  StudentFormFieldValue,
} from "@/types/student";
import { formatPhone } from "@/lib/formatters";

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
  onChange: (field: keyof StudentFormData, value: StudentFormFieldValue) => void;
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
        placeholder="(22)999999999"
        value={formatPhone(data.telephone)}
        onChange={(e) => onChange("telephone", e.target.value.replace(/\D/g, "").slice(0, 11))}
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
        <>
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer">
              <input
                type="checkbox"
                checked={data.alreadyUsesTransport}
                onChange={(e) => onChange("alreadyUsesTransport", e.target.checked)}
                className="size-4 accent-primary cursor-pointer"
              />
              <span className="text-sm text-on-surface">
                Aluno já faz uso do sistema de transporte
              </span>
            </label>

            <label className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasDisability}
                onChange={(e) => onChange("hasDisability", e.target.checked)}
                className="size-4 accent-primary cursor-pointer"
              />
              <span className="text-sm text-on-surface">
                Aluno é pessoa com deficiência (PCD)
              </span>
            </label>
          </div>

          <div className="space-y-4 rounded-xl border border-outline-variant p-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Documentos pessoais (opcional)
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Anexe agora ou deixe que o próprio aluno envie depois pelo app.
              </p>
            </div>

            {errors.documents && (
              <StatusBanner variant="error">{errors.documents}</StatusBanner>
            )}

            <DocumentUploadField
              label="Documento de identidade"
              value={data.governmentIdFile}
              onChange={(file) => onChange("governmentIdFile", file)}
            />
            <DocumentUploadField
              label="Comprovante de residência"
              value={data.proofOfResidenceFile}
              onChange={(file) => onChange("proofOfResidenceFile", file)}
            />
            {data.alreadyUsesTransport && (
              <DocumentUploadField
                label="Carteirinha de transporte atual"
                value={data.transportCardProofFile}
                onChange={(file) => onChange("transportCardProofFile", file)}
              />
            )}
            {data.hasDisability && (
              <DocumentUploadField
                label="Laudo médico (PCD)"
                value={data.disabilityProofFile}
                onChange={(file) => onChange("disabilityProofFile", file)}
              />
            )}
          </div>

          <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant">
            <p className="text-xs text-on-surface-variant italic">
              * Por motivos de segurança, a senha não é definida pelo administrador.
              O estudante receberá um e-mail com link para definir a própria senha
              assim que o cadastro for concluído.
            </p>
          </div>
        </>
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
