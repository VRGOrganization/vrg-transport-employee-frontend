"use client";

import { useState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { studentService } from "@/services/studentService";
import { studentAdminCreateSchema } from "@/lib/validation/student";
import { useZodForm } from "@/components/hooks/useZodForm";
import { toast } from "@/lib/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_VALUES = { name: "", email: "", telephone: "", cpf: "" };

export function StudentCreateModal({ open, onClose, onCreated }: Props) {
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  const { values, errors, generalError, loading, setValue, setValues, handleSubmit } = useZodForm({
    schema: studentAdminCreateSchema,
    initialValues: INITIAL_VALUES,
    onSubmit: async (data) => {
      try {
        await studentService.create({
          name:      data.name.trim(),
          email:     data.email.trim().toLowerCase(),
          telephone: data.telephone.trim(),
          cpf:       data.cpf,
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
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    setValues(INITIAL_VALUES);
    setSuccess(false);
  };

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : "Cadastrar Estudante"} size="md">
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
          <div className="flex gap-3 w-full pt-2">
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
          <p className="text-sm text-on-surface-variant mb-5">
            Preencha os dados básicos. O estudante receberá um e-mail para definir sua senha.
          </p>

          {generalError && (
            <StatusBanner variant="error" className="mb-5">{generalError}</StatusBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="(22) 99999-9999"
              value={values.telephone}
              onChange={(e) => setValue("telephone", e.target.value)}
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

            <div className="pt-1">
              <p className="text-xs text-on-surface-variant italic mb-4">
                * A senha será definida pelo próprio estudante através de um link enviado por
                e-mail após o cadastro.
              </p>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={<UserPlus className="size-4" />}
              >
                Cadastrar Estudante
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
