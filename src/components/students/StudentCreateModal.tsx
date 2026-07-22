"use client";

import { useState } from "react";
import { CheckCircle2, UserPlus, ArrowLeft, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { DocumentUploadField } from "@/components/students/DocumentUploadField";
import { studentService } from "@/services/studentService";
import { studentAdminCreateSchema } from "@/lib/validation/student";
import { useZodForm } from "@/components/hooks/useZodForm";
import { formatPhone } from "@/lib/formatters";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_VALUES = { name: "", email: "", telephone: "", cpf: "" };

interface ExtraFields {
  alreadyUsesTransport: boolean;
  hasDisability: boolean;
  governmentIdFile: File | null;
  proofOfResidenceFile: File | null;
  transportCardProofFile: File | null;
  disabilityProofFile: File | null;
}

const EMPTY_EXTRA: ExtraFields = {
  alreadyUsesTransport: false,
  hasDisability: false,
  governmentIdFile: null,
  proofOfResidenceFile: null,
  transportCardProofFile: null,
  disabilityProofFile: null,
};

const STEPS = [
  { label: "Dados básicos", icon: "person" },
  { label: "Transporte e documentos", icon: "folder_open" },
] as const;

const LAST_STEP = STEPS.length - 1;

// Janela de bloqueio do botão de envio logo após entrar no último passo — evita
// que um duplo-clique/segundo clique acidental na mesma posição de tela do
// botão "Próximo" (que vira "Cadastrar Estudante" assim que o passo muda)
// dispare a criação sem o usuário ter revisado o passo final.
const SUBMIT_COOLDOWN_MS = 400;

export function StudentCreateModal({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [submitLocked, setSubmitLocked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  const [extra, setExtra] = useState<ExtraFields>(EMPTY_EXTRA);
  const [documentsError, setDocumentsError] = useState("");

  const setExtraField = <K extends keyof ExtraFields>(field: K, value: ExtraFields[K]) => {
    setExtra((prev) => ({ ...prev, [field]: value }));
    setDocumentsError("");
  };

  const validateDocuments = (): string => {
    const hasAny =
      extra.governmentIdFile ||
      extra.proofOfResidenceFile ||
      extra.transportCardProofFile ||
      extra.disabilityProofFile;
    if (!hasAny) return "";
    if (!extra.governmentIdFile || !extra.proofOfResidenceFile) {
      return "Para anexar documentos, envie ao menos o documento de identidade e o comprovante de residência.";
    }
    if (extra.alreadyUsesTransport && !extra.transportCardProofFile) {
      return "Envie a carteirinha de transporte atual do aluno.";
    }
    if (extra.hasDisability && !extra.disabilityProofFile) {
      return "Envie o laudo médico que comprova a deficiência declarada.";
    }
    return "";
  };

  const { values, errors, generalError, loading, setValue, setValues, validate, handleSubmit } = useZodForm({
    schema: studentAdminCreateSchema,
    initialValues: INITIAL_VALUES,
    onSubmit: async (data) => {
      const docsError = validateDocuments();
      if (docsError) {
        setDocumentsError(docsError);
        setStep(LAST_STEP);
        return { success: false, error: docsError };
      }

      try {
        await studentService.create({
          name:      data.name.trim(),
          email:     data.email.trim().toLowerCase(),
          telephone: data.telephone.trim(),
          cpf:       data.cpf,
          alreadyUsesTransport:   extra.alreadyUsesTransport,
          hasDisability:          extra.hasDisability,
          governmentIdFile:       extra.governmentIdFile,
          proofOfResidenceFile:   extra.proofOfResidenceFile,
          transportCardProofFile: extra.transportCardProofFile,
          disabilityProofFile:    extra.disabilityProofFile,
        });
        const name = data.name.trim();
        setSuccessName(name);
        setSuccessEmail(data.email.trim().toLowerCase());
        setSuccess(true);
        toast.success(`Estudante ${name} cadastrado com sucesso.`);
        onCreated();
        return { success: true };
      } catch (err: unknown) {
        const error = err as { message?: string; status?: number };
        if (error.status === 409) {
          const msg = (error.message ?? "").toLowerCase();
          if (msg.includes("email")) return { success: false, error: "Este e-mail já está cadastrado" };
          if (msg.includes("cpf"))   return { success: false, error: "Este CPF já está cadastrado" };
          return { success: false, error: "Dados já cadastrados no sistema" };
        }
        return { success: false, error: error.message ?? "Erro ao cadastrar estudante" };
      }
    },
  });

  const handleNewRegistration = () => {
    setValues(INITIAL_VALUES);
    setExtra(EMPTY_EXTRA);
    setDocumentsError("");
    setStep(0);
    setSubmitLocked(false);
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    setValues(INITIAL_VALUES);
    setExtra(EMPTY_EXTRA);
    setDocumentsError("");
    setStep(0);
    setSubmitLocked(false);
    setSuccess(false);
  };

  const goNext = () => {
    // Passo 1 (dados básicos) precisa validar antes de avançar — não espera o
    // envio final para mostrar erro de formato/obrigatoriedade.
    if (step === 0 && !validate()) return;
    setStep((s) => {
      const nextStep = Math.min(LAST_STEP, s + 1);
      if (nextStep === LAST_STEP) {
        setSubmitLocked(true);
        setTimeout(() => setSubmitLocked(false), SUBMIT_COOLDOWN_MS);
      }
      return nextStep;
    });
  };
  const goBack = () => {
    setSubmitLocked(false);
    setStep((s) => Math.max(0, s - 1));
  };

  // Guarda defensiva: qualquer submit do <form> (Enter, clique duplo que acerte
  // o botão "Cadastrar" assim que ele aparece na mesma posição do "Próximo",
  // teclado virtual, etc.) só chega a criar o aluno quando já estamos no último
  // passo. Fora do último passo, o submit vira apenas um avanço de passo.
  const onFormSubmit = (e: React.FormEvent) => {
    if (step !== LAST_STEP) {
      e.preventDefault();
      goNext();
      return;
    }
    if (submitLocked) {
      e.preventDefault();
      return;
    }
    handleSubmit(e);
  };

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : "Cadastrar Estudante"} size="wide">
      {success ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="p-4 rounded-full bg-success/10">
            <CheckCircle2 className="size-10 text-success" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-on-surface">Estudante cadastrado!</h3>
            <p className="text-sm text-on-surface-variant max-w-xs">
              A conta de <strong>{successName}</strong> foi criada com sucesso. Um e-mail de
              definição de senha foi enviado para {successEmail}.
            </p>
          </div>
          <div className="flex gap-3 w-full max-w-sm pt-2">
            <Button variant="outline" size="md" fullWidth onClick={handleClose}>
              Fechar
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={<UserPlus className="size-4" />}
              onClick={handleNewRegistration}
            >
              Novo cadastro
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Indicador de passos ─────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex items-center gap-2 flex-1 rounded-xl px-3 py-2 border transition-colors",
                    i === step
                      ? "bg-primary/10 border-primary text-primary"
                      : i < step
                        ? "bg-success/10 border-success/30 text-success"
                        : "bg-surface-container border-outline-variant/40 text-on-surface-variant",
                  )}
                >
                  <span className="material-symbols-outlined text-lg shrink-0">
                    {i < step ? "check_circle" : s.icon}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide truncate">
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {generalError && (
            <StatusBanner variant="error" className="mb-5">{generalError}</StatusBanner>
          )}

          <form onSubmit={onFormSubmit} className="space-y-5">
            {/* ── Passo 1: dados básicos ────────────────────────────── */}
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Nome completo"
                  type="text"
                  icon="person"
                  placeholder="Maria da Silva"
                  value={values.name}
                  onChange={(e) => setValue("name", e.target.value)}
                  error={errors.name}
                />

                <Input
                  label="E-mail"
                  type="email"
                  icon="mail"
                  placeholder="aluno@email.com"
                  value={values.email}
                  onChange={(e) => setValue("email", e.target.value)}
                  error={errors.email}
                />

                <Input
                  label="Telefone"
                  type="tel"
                  icon="phone"
                  placeholder="(22)999999999"
                  value={formatPhone(values.telephone)}
                  onChange={(e) => setValue("telephone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                  error={errors.telephone}
                />

                <Input
                  label="CPF (apenas números)"
                  type="text"
                  icon="badge"
                  placeholder="12345678909"
                  maxLength={11}
                  value={values.cpf}
                  onChange={(e) => setValue("cpf", e.target.value.replace(/\D/g, ""))}
                  error={errors.cpf}
                />
              </div>
            )}

            {/* ── Passo 2: transporte, PCD e documentos ─────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={extra.alreadyUsesTransport}
                      onChange={(e) => setExtraField("alreadyUsesTransport", e.target.checked)}
                      className="size-4 accent-primary cursor-pointer"
                    />
                    <span className="text-sm text-on-surface">
                      Aluno já faz uso do sistema de transporte
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={extra.hasDisability}
                      onChange={(e) => setExtraField("hasDisability", e.target.checked)}
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

                  {documentsError && (
                    <StatusBanner variant="error">{documentsError}</StatusBanner>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DocumentUploadField
                      label="Documento de identidade"
                      value={extra.governmentIdFile}
                      onChange={(file) => setExtraField("governmentIdFile", file)}
                    />
                    <DocumentUploadField
                      label="Comprovante de residência"
                      value={extra.proofOfResidenceFile}
                      onChange={(file) => setExtraField("proofOfResidenceFile", file)}
                    />
                    {extra.alreadyUsesTransport && (
                      <DocumentUploadField
                        label="Carteirinha de transporte atual"
                        value={extra.transportCardProofFile}
                        onChange={(file) => setExtraField("transportCardProofFile", file)}
                      />
                    )}
                    {extra.hasDisability && (
                      <DocumentUploadField
                        label="Laudo médico (PCD)"
                        value={extra.disabilityProofFile}
                        onChange={(file) => setExtraField("disabilityProofFile", file)}
                      />
                    )}
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant italic">
                  * A senha será definida pelo próprio estudante através de um link enviado por
                  e-mail após o cadastro.
                </p>
              </div>
            )}

            {/* ── Navegação ──────────────────────────────────────────── */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  icon={<ArrowLeft className="size-4" />}
                  onClick={goBack}
                >
                  Voltar
                </Button>
              )}
              {step < LAST_STEP ? (
                <Button type="button" variant="primary" size="lg" fullWidth onClick={goNext}>
                  Próximo
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={submitLocked}
                  icon={<UserPlus className="size-4" />}
                >
                  Cadastrar Estudante
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
