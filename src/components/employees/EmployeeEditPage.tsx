"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { employeeService } from "@/services/employeeService";
import {
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Loader2,
  UserX,
} from "lucide-react";
import { EmployeeEditForm, type ChangeEntry } from "@/components/employees/EmployeeEditForm";
import { EmployeeEditConfirmView } from "@/components/employees/EmployeeEditConfirmView";

import type { Employee } from "@/types/employee";

function EditEmployeeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formView, setFormView] = useState<"edit" | "confirm">("edit");
  const [pendingPayload, setPendingPayload] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<ChangeEntry[]>([]);
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
      } catch (err: unknown) {
        if (process.env.NODE_ENV !== "production") console.error("Erro ao buscar funcionário:", err);
        setGeneralError("Não foi possível carregar os dados do funcionário");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, router]);

  const handlePrepareConfirm = (payload: Record<string, string>, changes: ChangeEntry[]) => {
    setPendingPayload(payload);
    setPendingChanges(changes);
    setFormView("confirm");
  };

  const handleConfirmUpdate = async () => {
    setSaving(true);
    setGeneralError("");
    try {
      const updated = await employeeService.update(id!, pendingPayload);
      setEmployee(updated);
      setSuccess(true);
      setFormView("edit");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGeneralError(error.message ?? "Erro ao atualizar funcionário");
      setFormView("edit");
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
      setGeneralError(error.message ?? "Erro ao desativar funcionário");
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
      setGeneralError(error.message ?? "Erro ao reativar funcionário");
      setShowActivateConfirm(false);
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-8 text-primary animate-spin" />
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
                {success && (
                  <div className="flex items-center gap-1.5 text-success text-sm font-medium mb-4 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="size-4" />
                    Alterações salvas!
                  </div>
                )}
                {employee && formView === "edit" && (
                  <EmployeeEditForm
                    employee={employee}
                    generalError={generalError}
                    hideHeader
                    onCancel={() => router.push("/admin/employees")}
                    onPrepareConfirm={handlePrepareConfirm}
                  />
                )}
                {employee && formView === "confirm" && (
                  <EmployeeEditConfirmView
                    changes={pendingChanges}
                    loading={saving}
                    hideHeader
                    onBack={() => setFormView("edit")}
                    onConfirm={() => void handleConfirmUpdate()}
                  />
                )}
              </div>

              {/* Status Section */}
              <div className="space-y-6">
                {employee?.active ? (
                  <div className="bg-error-container/20 border border-error-border/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-error mb-4">
                      <AlertTriangle className="size-5" />
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
                      icon={<Trash2 className="size-4" />}
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Desativar Funcionário
                    </Button>
                  </div>
                ) : (
                  <div className="bg-success-container/20 border border-success/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-success mb-4">
                      <CheckCircle2 className="size-5" />
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
                      icon={<CheckCircle2 className="size-4" />}
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
              icon={<UserX className="size-4" />}
              onClick={handleDeactivate}
            >
              Sim, desativar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="p-4 bg-error/10 rounded-full">
            <UserX className="size-9 text-error" />
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
              icon={<CheckCircle2 className="size-4" />}
              onClick={handleActivate}
            >
              Sim, reativar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="p-4 bg-success/10 rounded-full">
            <CheckCircle2 className="size-9 text-success" />
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

export function EmployeeEditPage({ role }: { role: "admin" | "employee" }) {
  void role;
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    }>
      <EditEmployeeContent />
    </Suspense>
  );
}
