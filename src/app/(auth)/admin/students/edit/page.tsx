"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";

import { Student } from "@/types/student";
import { StudentForm } from "@/components/students/StudentForm";
import { StudentFormLayout } from "@/components/students/StudentFormLayout";
import { SuccessBanner } from "@/components/students/SuccessBanner";
import { useStudentForm } from "@/components/hooks/useStudentForm";

function EditStudentPageInner() {
  const { user, logout } = useEmployeeAuth();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<Student | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [success, setSuccess] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const { data, errors, loading, setLoading, onChange, setError, validate, clearErrors } =
    useStudentForm({ mode: "edit" });

  // Load student data
  useEffect(() => {
    if (!studentId) {
      setFetchError("ID do estudante não encontrado");
      setFetchLoading(false);
      return;
    }

    const load = async () => {
      try {
        const s = await employeeApi.get<Student>(`/student/${studentId}`);
        setStudent(s);
        onChange("name", s.name);
        onChange("email", s.email);
        onChange("telephone", s.telephone ?? "");
        onChange("institution", s.institution ?? "");
        onChange("shift", s.shift ?? "");
      } catch {
        setFetchError("Não foi possível carregar os dados do estudante");
      } finally {
        setFetchLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    clearErrors();
    try {
      await employeeApi.patch(`/student/${studentId}`, {
        name: data.name.trim(),
        telephone: data.telephone.trim(),
        institution: data.institution,
        shift: data.shift,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError("general", error.message ?? "Erro ao atualizar estudante");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!student) return;
    if (student.active && !confirmDeactivate) {
      setConfirmDeactivate(true);
      return;
    }

    setStatusLoading(true);
    try {
      const endpoint = student.active
        ? `/student/${studentId}/deactivate`
        : `/student/${studentId}/activate`;
      await employeeApi.patch(endpoint, {});
      setStudent((prev) => prev ? { ...prev, active: !prev.active } : prev);
      setConfirmDeactivate(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError("general", error.message ?? "Erro ao alterar status do estudante");
    } finally {
      setStatusLoading(false);
    }
  };

  // Loading skeleton
  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
        <SideNav activePath="/admin/students" onLogout={logout} />
        <div className="min-w-0 flex flex-col">
          <TopBar user={user} />
          <main className="p-8">
            <div className="max-w-lg mx-auto space-y-4 animate-pulse">
              <div className="h-8 bg-surface-container-high rounded-xl w-1/2" />
              <div className="h-64 bg-surface-container-high rounded-2xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Fetch error
  if (fetchError) {
    return (
      <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
        <SideNav activePath="/admin/students" onLogout={logout} />
        <div className="min-w-0 flex flex-col">
          <TopBar user={user} />
          <main className="p-8">
            <div className="max-w-lg mx-auto flex flex-col items-center gap-4 py-16 text-center">
              <span className="material-symbols-outlined text-error" style={{ fontSize: "40px" }}>
                error
              </span>
              <p className="text-on-surface-variant">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                Voltar
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav activePath="/admin/students" onLogout={logout} />

      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />

        <main className="bg-surface p-8 min-h-[calc(100vh-4rem)]">
          <StudentFormLayout
            title="Editar Estudante"
            subtitle={`Atualize os dados de ${student?.name ?? "estudante"}`}
            backHref="/admin/students"
          >
            {success ? (
              <SuccessBanner
                title="Dados atualizados!"
                description={`As informações de ${data.name} foram salvas com sucesso.`}
                backHref="/admin/students"
                backLabel="Ver estudantes"
                onReset={() => setSuccess(false)}
                resetLabel="Editar novamente"
                resetIcon="edit"
              />
            ) : (
              <>
                {/* Status badge */}
                {student && (
                  <div className="flex items-center justify-between mb-5 pb-5 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          student.active ? "bg-green-500" : "bg-slate-300"
                        }`}
                      />
                      <span className="text-sm font-medium text-on-surface-variant">
                        {student.active ? "Conta ativa" : "Conta desativada"}
                      </span>
                    </div>

                    {/* Toggle active/inactive */}
                    {confirmDeactivate ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">Confirmar desativação?</span>
                        <button
                          onClick={() => setConfirmDeactivate(false)}
                          className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 rounded-lg hover:bg-surface-container-high transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleToggleStatus}
                          disabled={statusLoading}
                          className="text-xs font-semibold text-error hover:bg-error-container px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {statusLoading ? "Aguarde..." : "Confirmar"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleToggleStatus}
                        disabled={statusLoading}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          student.active
                            ? "text-error hover:bg-error-container"
                            : "text-success hover:bg-success-container"
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          {student.active ? "person_off" : "person_check"}
                        </span>
                        {student.active ? "Desativar" : "Reativar"}
                      </button>
                    )}
                  </div>
                )}

                <StudentForm
                  data={data}
                  errors={errors}
                  loading={loading}
                  mode="edit"
                  onChange={onChange}
                  onSubmit={handleSubmit}
                />
              </>
            )}
          </StudentFormLayout>

          <div className="mt-auto w-full">
            <Footer />
          </div>

        </main>
      </div>
    </div>
  );
}

export default function EditStudentPage() {
  return (
    <Suspense>
      <EditStudentPageInner />
    </Suspense>
  );
}


