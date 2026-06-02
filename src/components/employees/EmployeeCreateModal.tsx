"use client";

import { useState } from "react";
import { Badge, CheckCircle2, Mail, User, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { employeeService } from "@/services/employeeService";
import { employeeCreateSchema } from "@/lib/validation/employee";
import { useZodForm } from "@/components/hooks/useZodForm";
import { toast } from "@/lib/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function EmployeeCreateModal({ open, onClose, onCreated }: Props) {
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  const { values, errors, generalError, loading, setValue, setValues, handleSubmit } = useZodForm({
    schema: employeeCreateSchema,
    initialValues: { name: "", email: "", registrationId: "" },
    onSubmit: async (data) => {
      try {
        await employeeService.create({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          registrationId: data.registrationId.trim(),
        });
        setSuccessName(data.name.trim());
        setSuccessEmail(data.email.trim().toLowerCase());
        setSuccess(true);
        toast.success(`Funcionário ${data.name.trim()} cadastrado com sucesso.`);
        onCreated();
        return { success: true };
      } catch (err: unknown) {
        const error = err as { message?: string; status?: number };
        if (error.status === 409) {
          const msg = (error.message ?? "").toLowerCase();
          if (msg.includes("email")) return { success: false, error: "Este e-mail já está em uso" };
          if (msg.includes("matricula") || msg.includes("registration"))
            return { success: false, error: "Esta matrícula já está em uso" };
          return { success: false, error: "Dados já cadastrados no sistema" };
        }
        return { success: false, error: error.message ?? "Erro ao cadastrar funcionário" };
      }
    },
  });

  const handleNewRegistration = () => {
    setValues({ name: "", email: "", registrationId: "" });
    setSuccess(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={success ? undefined : "Cadastrar Funcionário"}
      size="md"
    >
      {success ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="p-4 rounded-full bg-success/10">
            <CheckCircle2 className="size-10 text-success" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-on-surface">Funcionário cadastrado!</h3>
            <p className="text-sm text-on-surface-variant max-w-xs">
              A conta de <strong>{successName}</strong> foi criada com sucesso. Um e-mail de
              definição de senha foi enviado para {successEmail}.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <Button variant="outline" size="md" fullWidth onClick={onClose}>
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
            Preencha os dados básicos. O funcionário receberá um e-mail para definir sua senha.
          </p>

          {generalError && (
            <StatusBanner variant="error" className="mb-5">{generalError}</StatusBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                Nome completo
              </label>
              <Input
                type="text"
                icon={<User className="size-5" />}
                placeholder="Maria da Silva"
                value={values.name}
                onChange={(e) => setValue("name", e.target.value)}
                error={errors.name}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                E-mail
              </label>
              <Input
                type="email"
                icon={<Mail className="size-5" />}
                placeholder="funcionario@empresa.com"
                value={values.email}
                onChange={(e) => setValue("email", e.target.value)}
                error={errors.email}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                Matrícula
              </label>
              <Input
                type="text"
                icon={<Badge className="size-5" />}
                placeholder="MAT123456"
                value={values.registrationId}
                onChange={(e) => setValue("registrationId", e.target.value)}
                error={errors.registrationId}
              />
            </div>

            <div className="pt-1">
              <p className="text-xs text-on-surface-variant italic mb-4">
                * A senha será definida pelo próprio funcionário através de um link enviado por
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
                Cadastrar Funcionário
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
