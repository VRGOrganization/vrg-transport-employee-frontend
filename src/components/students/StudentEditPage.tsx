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
import { AlertCircle } from "lucide-react";

interface StudentEditPageProps {
  role: "admin" | "employee";
}

function StudentEditPageInner({ role }: StudentEditPageProps) {
  const backHref = role === "admin" ? "/admin/students" : "/employee/students";
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<Student | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [success, setSuccess] = useState(false);
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
    <main className="bg-surface p-8 min-h-[calc(100vh-4rem)] flex flex-col">
        <StudentFormLayout
          title="Editar Estudante"
          subtitle={`Atualize os dados de ${student?.name ?? "estudante"}`}
          backHref={backHref}
        >
          {success ? (
            <SuccessBanner
              title="Dados atualizados!"
              description={`As informações de ${data.name} foram salvas com sucesso.`}
              backHref={backHref}
              backLabel="Ver estudantes"
              onReset={() => setSuccess(false)}
              resetLabel="Editar novamente"
              resetIcon="edit"
            />
          ) : (
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
          )}
        </StudentFormLayout>

        <div className="mt-auto w-full">
          <Footer />
        </div>
    </main>
  );
}

export function StudentEditPage({ role }: StudentEditPageProps) {
  return (
    <Suspense>
      <StudentEditPageInner role={role} />
    </Suspense>
  );
}
