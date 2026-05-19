"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { employeeService } from "@/services/employeeService";
import {
  Badge,
  CheckCircle2,
  Mail,
  User,
  Trash2,
  AlertTriangle,
  Loader2,
  UserX,
} from "lucide-react";

import type { Employee } from "@/types/employee";

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

function EditEmployeeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    registrationId: "",
  });
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!id) {
      router.push("/admin/employees");
      return;
    }

    const fetchEmployee = async () => {
      try {
        const data = await employeeService.getById(id!);
        setEmployee(data);
        setFormData({
          name: data.name,
          email: data.email,
          registrationId: data.registrationId,
        });
      } catch (err: unknown) {
        console.error("Erro ao buscar funcionário:", err);
        setErrors((prev) => ({ ...prev, general: "Não foi possível carregar os dados do funcionário" }));
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, router]);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const next = { ...emptyErrors };

    if (!formData.name.trim()) {
      next.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      next.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "Email inválido";
    }

    if (!formData.registrationId.trim()) {
      next.registrationId = "Matrícula é obrigatória";
    }

    setErrors(next);
    return Object.values(next).every((msg) => msg === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await employeeService.update(id!, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        registrationId: formData.registrationId.trim(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      setErrors((prev) => ({
        ...prev,
        general: error.message ?? "Erro ao atualizar funcionário",
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await employeeService.deactivate(id!);
      router.push("/admin/employees");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrors((prev) => ({
        ...prev,
        general: error.message ?? "Erro ao desativar funcionário",
      }));
      setShowDeleteConfirm(false);
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      await employeeService.reactivate(id!);
      router.push("/admin/employees");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrors((prev) => ({
        ...prev,
        general: error.message ?? "Erro ao reativar funcionário",
      }));
      setShowActivateConfirm(false);
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
    <main className="mx-auto w-full space-y-6 max-w-4xl pb-10">
          <div className="px-6 lg:px-10">
            <PageHeader
              back="/admin/employees"
              title="Editar Funcionário"
              subtitle={
                employee?.active
                  ? "Atualize as informações do cadastro ou desative o acesso."
                  : "Este funcionário está inativo. Você pode reativar o acesso abaixo."
              }
              className="mt-6"
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6 mt-8">
              {/* Form Section */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errors.general && (
                    <StatusBanner variant="error">{errors.general}</StatusBanner>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                      Nome completo
                    </label>
                    <Input
                      type="text"
                      icon={<User className="w-5 h-5" />}
                      placeholder="Nome do funcionário"
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
                      placeholder="email@exemplo.com"
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

                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {success && (
                        <div className="flex items-center gap-1.5 text-success text-sm font-medium animate-in fade-in slide-in-from-left-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Alterações salvas!
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={saving}
                      icon="check"
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </div>

              {/* Status Section */}
              <div className="space-y-6">
                {employee?.active ? (
                  <div className="bg-error-container/20 border border-error-border/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-error mb-4">
                      <AlertTriangle className="w-5 h-5" />
                      <h3 className="font-bold text-sm uppercase tracking-wider">Zona de Perigo</h3>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
                      Desativar um funcionário impedirá que ele acesse o sistema imediatamente. Os dados serão preservados para histórico.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      className="border-error text-error hover:bg-error/5"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Desativar Funcionário
                    </Button>
                  </div>
                ) : (
                  <div className="bg-success-container/20 border border-success/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-success mb-4">
                      <CheckCircle2 className="w-5 h-5" />
                      <h3 className="font-bold text-sm uppercase tracking-wider">Reativação</h3>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
                      Reativar este funcionário permitirá que ele volte a acessar o sistema com suas credenciais atuais.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      className="border-success text-success hover:bg-success/5"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => setShowActivateConfirm(true)}
                    >
                      Ativar Funcionário
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      {/* Deactivation Modal */}
      <BottomSheet
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Desativar funcionário?"
        actions={
          <div className="flex gap-3">
            <Button variant="outline" size="md" fullWidth onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              className="bg-error hover:bg-error/90 border-none text-white font-bold"
              loading={deactivating}
              icon={<UserX className="w-4 h-4" />}
              onClick={handleDeactivate}
            >
              Sim, desativar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="p-4 bg-error/10 rounded-full">
            <UserX className="w-9 h-9 text-error" />
          </div>
          <p className="text-sm text-on-surface-variant max-w-xs">
            O funcionário <span className="font-semibold text-on-surface">{employee?.name}</span> perderá
            acesso ao sistema imediatamente.
          </p>
        </div>
      </BottomSheet>

      {/* Activation Modal */}
      <BottomSheet
        open={showActivateConfirm}
        onClose={() => setShowActivateConfirm(false)}
        title="Reativar funcionário?"
        actions={
          <div className="flex gap-3">
            <Button variant="outline" size="md" fullWidth onClick={() => setShowActivateConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              className="bg-success hover:bg-success/90 border-none text-white font-bold"
              loading={activating}
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleActivate}
            >
              Sim, reativar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="p-4 bg-success/10 rounded-full">
            <CheckCircle2 className="w-9 h-9 text-success" />
          </div>
          <p className="text-sm text-on-surface-variant max-w-xs">
            O funcionário <span className="font-semibold text-on-surface">{employee?.name}</span> recuperará
            o acesso ao sistema imediatamente.
          </p>
        </div>
      </BottomSheet>
    </>
  );
}

export default function AdminEmployeeEditPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <EditEmployeeContent />
    </Suspense>
  );
}
