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
import { AlertCircle, UserCheck, UserX, X, CheckCircle2 } from "lucide-react";

function EditStudentPageInner() {
  const { user, logout } = useEmployeeAuth();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<Student | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [success, setSuccess] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [modalView, setModalView] = useState<"deactivate" | "activate" | null>(null);

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

  const confirmToggleStatus = async () => {
    if (!student || !modalView) return;
    setStatusLoading(true);
    try {
      const endpoint = modalView === "deactivate"
        ? `/student/${studentId}/deactivate`
        : `/student/${studentId}/activate`;
      await employeeApi.patch(endpoint, {});
      setStudent((prev) => prev ? { ...prev, active: modalView === "activate" } : prev);
      setModalView(null);
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
              <AlertCircle className="w-10 h-10 text-error" />
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

        <main className="bg-surface p-8 min-h-[calc(100vh-4rem)] flex flex-col">
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
                          student.active ? "bg-success" : "bg-surface-container-high"
                        }`}
                      />
                      <span className="text-sm font-medium text-on-surface-variant">
                        {student.active ? "Conta ativa" : "Conta desativada"}
                      </span>
                    </div>

                    {/* Toggle active/inactive */}
                    <button
                      onClick={() => setModalView(student.active ? "deactivate" : "activate")}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        student.active
                          ? "text-error hover:bg-error-container"
                          : "text-success hover:bg-success-container"
                      }`}
                    >
                      {student.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      {student.active ? "Desativar" : "Reativar"}
                    </button>
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

      {/* ── MODALS ── */}
      {modalView === "deactivate" && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setModalView(null)}
        >
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="font-headline font-semibold text-lg text-on-surface">
                Desativar estudante?
              </h2>
              <button
                onClick={() => setModalView(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center gap-3 py-4 text-center mb-5">
                <div className="p-4 bg-error/10 rounded-full">
                  <UserX className="w-9 h-9 text-error" />
                </div>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  O estudante <span className="font-semibold text-on-surface">{student?.name}</span> perderá
                  acesso ao sistema imediatamente. O cadastro poderá ser reativado posteriormente.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" fullWidth onClick={() => setModalView(null)}>
                  Cancelar
                </Button>
                <button
                  disabled={statusLoading}
                  onClick={confirmToggleStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-error text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {statusLoading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <UserX className="w-4.5 h-4.5" />
                  )}
                  Sim, desativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalView === "activate" && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setModalView(null)}
        >
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="font-headline font-semibold text-lg text-on-surface">
                Reativar estudante?
              </h2>
              <button
                onClick={() => setModalView(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center gap-3 py-4 text-center mb-5">
                <div className="p-4 bg-success/10 rounded-full">
                  <CheckCircle2 className="w-9 h-9 text-success" />
                </div>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  O estudante <span className="font-semibold text-on-surface">{student?.name}</span> recuperará
                  acesso ao sistema imediatamente.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" fullWidth onClick={() => setModalView(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  className="bg-success hover:bg-success/90 border-none text-white"
                  loading={statusLoading}
                  icon="check"
                  onClick={confirmToggleStatus}
                >
                  Sim, reativar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
