"use client";

import { useEffect, useState } from "react";
import { studentService } from "@/services/studentService";
import { universityService } from "@/services/universityService";
import { StudentForm } from "@/components/students/StudentForm";
import { StudentFormLayout } from "@/components/students/StudentFormLayout";
import { SuccessBanner } from "@/components/students/SuccessBanner";
import { useStudentForm } from "@/components/hooks/useStudentForm";
import type { University } from "@/types/university.types";

export default function NewStudentPage() {
  const [success, setSuccess] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const { data, errors, loading, setLoading, onChange, setError, validate } =
    useStudentForm({ mode: "create" });

  useEffect(() => {
    setLoadingUniversities(true);
    universityService.list()
      .then(setUniversities)
      .catch(() => {})
      .finally(() => setLoadingUniversities(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await studentService.create({
        name:      data.name.trim(),
        email:     data.email.trim().toLowerCase(),
        telephone: data.telephone.trim(),
        cpf:       data.cpf.replace(/\D/g, ""),
        ...(data.institution ? { institution: data.institution.trim() } : {}),
        ...(data.shift       ? { shift: data.shift }                   : {}),
        ...(data.bloodType   ? { bloodType: data.bloodType }           : {}),
        ...(data.degree      ? { degree: data.degree.trim() }          : {}),
      });
      setCreatedName(data.name.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      if (error.status === 409) {
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("email")) {
          setError("email", "Este email já está cadastrado");
        } else if (msg.includes("cpf")) {
          setError("cpf", "Este CPF já está cadastrado");
        } else {
          setError("general", error.message ?? "Dados já cadastrados");
        }
      } else {
        setError("general", error.message ?? "Erro ao cadastrar estudante");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setCreatedName("");
    onChange("name", "");
    onChange("email", "");
    onChange("telephone", "");
    onChange("cpf", "");
    onChange("institution", "");
    onChange("shift", "");
    onChange("bloodType", "");
    onChange("degree", "");
  };

  return (
    <main className="px-6 py-5 bg-surface flex flex-col gap-5">
      <div className="mx-auto w-full space-y-6">
        <StudentFormLayout
            title="Cadastrar Estudante"
            subtitle="Preencha os dados para criar uma nova conta de estudante"
            backHref="/admin/students"
          >
            {success ? (
              <SuccessBanner
                title="Estudante cadastrado!"
                description={`A conta de ${createdName} foi criada com sucesso. Um e-mail para definição de senha foi enviado.`}
                backHref="/admin/students"
                backLabel="Ver estudantes"
                onReset={handleReset}
                resetLabel="Novo cadastro"
              />
            ) : (
              <StudentForm
                data={data}
                errors={errors}
                loading={loading}
                mode="create"
                onChange={onChange}
                onSubmit={handleSubmit}
                universities={universities}
                loadingUniversities={loadingUniversities}
              />
            )}
        </StudentFormLayout>
      </div>
    </main>
  );
}
