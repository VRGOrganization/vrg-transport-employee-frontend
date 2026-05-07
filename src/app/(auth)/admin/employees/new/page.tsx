"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";
import {
  ArrowLeft,
  Badge,
  CheckCircle2,
  Mail,
  User,
  UserPlus,
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  registrationId: string;
}

interface FormErrors {
  name: string;
  email: string;
  registrationId: string;
  general: string;
}

const emptyErrors: FormErrors = {
  name: "",
  email: "",
  registrationId: "",
  general: "",
};

export default function RegisterEmployeePage() {
  const { user, logout } = useEmployeeAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    registrationId: "",
  });
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const next = { ...emptyErrors };
    let valid = true;

    if (!formData.name.trim()) {
      next.name = "Nome é obrigatório";
      valid = false;
    } else if (formData.name.trim().length > 100) {
      next.name = "Nome deve ter no máximo 100 caracteres";
      valid = false;
    }

    if (!formData.email.trim()) {
      next.email = "Email é obrigatório";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "Email inválido";
      valid = false;
    }

    if (!formData.registrationId.trim()) {
      next.registrationId = "Matrícula é obrigatória";
      valid = false;
    }

    setErrors(next);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await employeeApi.post("/employee", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        registrationId: formData.registrationId.trim(),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      if (error.status === 409) {
        const msg = error.message ?? "";
        if (msg.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: "Este email já está em uso" }));
        } else if (
          msg.toLowerCase().includes("matricula") ||
          msg.toLowerCase().includes("registration")
        ) {
          setErrors((prev) => ({
            ...prev,
            registrationId: "Esta matrícula já está em uso",
          }));
        } else {
          setErrors((prev) => ({ ...prev, general: "Dados já cadastrados no sistema" }));
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          general: error.message ?? "Erro ao cadastrar funcionário",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewRegistration = () => {
    setFormData({ name: "", email: "", registrationId: "" });
    setErrors(emptyErrors);
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav activePath="/admin/employees" onLogout={logout} />
      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />
        <main className="mx-auto w-full space-y-6">
          <div className="">
            <div className="mt-6 flex items-center gap-3 ml-10">
              <Link
                href="/admin/employees"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                title="Voltar ao painel"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-headline font-bold text-2xl text-on-surface">
                  Cadastrar Funcionário
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Preencha os dados básicos. O funcionário receberá um e-mail para definir sua senha.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mt-5 ml-10 mr-10">
              {success ? (
                <div className="flex flex-col items-center gap-5 py-6 text-center">
                  <div className="p-4 bg-success/10 rounded-full">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  <div>
                    <h2 className="font-headline font-semibold text-lg text-on-surface">
                      Funcionário cadastrado!
                    </h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                      A conta de <span className="font-medium">{formData.name}</span> foi
                      criada com sucesso. Um e-mail de definição de senha foi enviado para <span className="font-medium">{formData.email}</span>.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full">
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
                  </div>
                </div>
              ) : (
                <>
                  {errors.general && (
                    <div className="mb-5 bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3">
                      {errors.general}
                    </div>
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
                        value={formData.name}
                        onChange={set("name")}
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
                        value={formData.email}
                        onChange={set("email")}
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
                        value={formData.registrationId}
                        onChange={set("registrationId")}
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
      </div>
    </div>
  );
}
