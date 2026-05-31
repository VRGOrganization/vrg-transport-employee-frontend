"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { ResultState } from "@/components/ui/ResultState";
import { employeeService } from "@/services/employeeService";
import { employeeCreateSchema } from "@/lib/validation/employee";
import { useZodForm } from "@/components/hooks/useZodForm";
import { ArrowLeft, Badge, CheckCircle2, Mail, User, UserPlus } from "lucide-react";

export default function RegisterEmployeePage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  const { values, errors, generalError, loading, setValue, handleSubmit } = useZodForm({
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
        return { success: true };
      } catch (err: unknown) {
        const error = err as { message?: string; status?: number };
        if (error.status === 409) {
          const msg = (error.message ?? "").toLowerCase();
          if (msg.includes("email")) return { success: false, error: "Este email já está em uso" };
          if (msg.includes("matricula") || msg.includes("registration"))
            return { success: false, error: "Esta matrícula já está em uso" };
          return { success: false, error: "Dados já cadastrados no sistema" };
        }
        return { success: false, error: error.message ?? "Erro ao cadastrar funcionário" };
      }
    },
  });

  const handleNewRegistration = () => {
    setValue("name", "");
    setValue("email", "");
    setValue("registrationId", "");
    setSuccess(false);
  };

  return (
    <main className="mx-auto w-full space-y-6">
      <div className="">
        <PageHeader
          back="/admin/employees"
          title="Cadastrar Funcionário"
          subtitle="Preencha os dados básicos. O funcionário receberá um e-mail para definir sua senha."
          className="mt-6 ml-10"
        />

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm ml-10 mr-10">
          {success ? (
            <ResultState
              variant="success"
              icon={CheckCircle2}
              title="Funcionário cadastrado!"
              description={`A conta de ${successName} foi criada com sucesso. Um e-mail de definição de senha foi enviado para ${successEmail}.`}
              size="md"
              className="py-6"
              actions={
                <>
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    icon={<ArrowLeft className="w-4 h-4" />}
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    Painel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    icon={<UserPlus className="w-4 h-4" />}
                    onClick={handleNewRegistration}
                  >
                    Novo cadastro
                  </Button>
                </>
              }
            />
          ) : (
            <>
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
                    icon={<User className="w-5 h-5" />}
                    placeholder="Maria da Silva"
                    value={values.name}
                    onChange={(e) => setValue("name", e.target.value)}
                    error={errors.name}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    icon={<Mail className="w-5 h-5" />}
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
                    icon={<Badge className="w-5 h-5" />}
                    placeholder="MAT123456"
                    value={values.registrationId}
                    onChange={(e) => setValue("registrationId", e.target.value)}
                    error={errors.registrationId}
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs text-on-surface-variant italic mb-4">
                    * Por motivos de segurança, a senha será definida pelo próprio funcionário através de um link enviado por e-mail após o cadastro.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    icon={<UserPlus className="w-4 h-4" />}
                  >
                    Cadastrar Funcionário
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
