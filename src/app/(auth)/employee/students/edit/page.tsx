"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ResultState } from "@/components/ui/ResultState";
import { studentService } from "@/services/studentService";
import { Student } from "@/types/student";
import { StudentForm } from "@/components/students/StudentForm";
import { StudentFormLayout } from "@/components/students/StudentFormLayout";
import { SuccessBanner } from "@/components/students/SuccessBanner";
import { useStudentForm } from "@/components/hooks/useStudentForm";

function EditStudentPageInner() {
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

  // Carrega os dados do estudante
  useEffect(() => {
    if (!studentId) {
      setFetchError("ID do estudante não encontrado");
      setFetchLoading(false);
      return;
    }

    const load = async () => {
      try {
        const s = await studentService.getById(studentId!);
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
      await studentService.update(studentId!, {
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
      if (student.active) await studentService.deactivate(studentId!);
      else await studentService.reactivate(studentId!);
      setStudent((prev) => (prev ? { ...prev, active: !prev.active } : prev));
      setConfirmDeactivate(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError("general", error.message ?? "Erro ao alterar status do estudante");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Skeleton de carregamento ──────────────────────────────────────────────
  if (fetchLoading) {
    return (
      <main className="p-8">
        <div className="max-w-lg mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-surface-container-high rounded-xl w-1/2" />
          <div className="h-64 bg-surface-container-high rounded-2xl" />
        </div>
      </main>
    );
  }

  // ── Erro de carregamento ──────────────────────────────────────────────────
  if (fetchError) {
    return (
      <main className="p-8">
        <div className="max-w-lg mx-auto py-16">
          <ResultState
            variant="error"
            icon={AlertCircle}
            title="Erro ao carregar"
            description={fetchError}
            size="sm"
            actions={
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                Voltar
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  // ── Página principal ──────────────────────────────────────────────────────
  return (
    <main className="bg-surface p-8 min-h-[calc(100vh-4rem)] flex flex-col">
          <StudentFormLayout
            title="Editar Estudante"
            subtitle={`Atualize os dados de ${student?.name ?? "estudante"}`}
            backHref="/employee/students"
          >
            {success ? (
              <SuccessBanner
                title="Dados atualizados!"
                description={`As informações de ${data.name} foram salvas com sucesso.`}
                backHref="/employee/students"
                backLabel="Ver estudantes"
                onReset={() => setSuccess(false)}
                resetLabel="Editar novamente"
                resetIcon="edit"
              />
            ) : (
              <>
                {/* Badge de status + toggle ativo/inativo */}
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

                    {confirmDeactivate ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">
                          Confirmar desativação?
                        </span>
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
                        <span className="material-symbols-outlined text-base">
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
  );
}

export default function EmployeeEditStudentPage() {
  return (
    <Suspense>
      <EditStudentPageInner />
    </Suspense>
  );
}

