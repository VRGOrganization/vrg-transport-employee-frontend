"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { studentService } from "@/services/studentService";
import { universityService } from "@/services/universityService";
import { Student } from "@/types/student";
import type { University } from "@/types/university.types";
import { StudentForm } from "@/components/students/StudentForm";
import { StudentFormLayout } from "@/components/students/StudentFormLayout";
import { SuccessBanner } from "@/components/students/SuccessBanner";
import { useStudentForm } from "@/components/hooks/useStudentForm";
import { AlertCircle, UserCheck, UserX, CheckCircle2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";

function EditStudentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<Student | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [success, setSuccess] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [modalView, setModalView] = useState<"deactivate" | "activate" | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const { data, errors, loading, setLoading, onChange, setError, validate, clearErrors } =
    useStudentForm({ mode: "edit" });

  useEffect(() => {
    setLoadingUniversities(true);
    universityService.list()
      .then(setUniversities)
      .catch(() => {})
      .finally(() => setLoadingUniversities(false));
  }, []);

  // Load student data
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
        onChange("name",        s.name);
        onChange("email",       s.email);
        onChange("telephone",   s.telephone   ?? "");
        onChange("institution", s.institution ?? "");
        onChange("shift",       s.shift       ?? "");
        onChange("bloodType",   s.bloodType   ?? "");
        onChange("degree",      s.degree      ?? "");
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
        name:      data.name.trim(),
        telephone: data.telephone.trim(),
        ...(data.institution ? { institution: data.institution.trim() } : { institution: "" }),
        ...(data.shift       ? { shift: data.shift }                    : {}),
        ...(data.bloodType   ? { bloodType: data.bloodType }            : {}),
        ...(data.degree      ? { degree: data.degree.trim() }           : {}),
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
      if (modalView === "deactivate") await studentService.deactivate(studentId!);
      else await studentService.reactivate(studentId!);
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
      <main className="p-8">
        <div className="max-w-lg mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-surface-container-high rounded-xl w-1/2" />
          <div className="h-64 bg-surface-container-high rounded-2xl" />
        </div>
      </main>
    );
  }

  // Fetch error
  if (fetchError) {
    return (
      <main className="p-8">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-4 py-16 text-center">
          <AlertCircle className="size-10 text-error" />
          <p className="text-on-surface-variant">{fetchError}</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
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
                        className={`size-2.5 rounded-full ${
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
                      {student.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
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
                  universities={universities}
                  loadingUniversities={loadingUniversities}
                />
              </>
            )}
          </StudentFormLayout>

          <div className="mt-auto w-full">
            <Footer />
          </div>

      </main>

      {/* ── MODALS ── */}
      <BottomSheet
        open={modalView === "deactivate"}
        onClose={() => setModalView(null)}
        title="Desativar estudante?"
        actions={
          <div className="flex gap-3">
            <Button variant="outline" size="sm" fullWidth onClick={() => setModalView(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              className="bg-error hover:bg-error/90 border-none text-white font-bold"
              loading={statusLoading}
              icon={<UserX className="size-4" />}
              onClick={confirmToggleStatus}
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
            O estudante <span className="font-semibold text-on-surface">{student?.name}</span> perderá
            acesso ao sistema imediatamente. O cadastro poderá ser reativado posteriormente.
          </p>
        </div>
      </BottomSheet>

      <BottomSheet
        open={modalView === "activate"}
        onClose={() => setModalView(null)}
        title="Reativar estudante?"
        actions={
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
              icon={<CheckCircle2 className="size-4" />}
              onClick={confirmToggleStatus}
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
            O estudante <span className="font-semibold text-on-surface">{student?.name}</span> recuperará
            acesso ao sistema imediatamente.
          </p>
        </div>
      </BottomSheet>
    </>
  );
}

export default function EditStudentPage() {
  return (
    <Suspense>
      <EditStudentPageInner />
    </Suspense>
  );
}
