"use client";

import { useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { studentService } from "@/services/studentService";
import { StudentForm } from "@/components/students/StudentForm";
import { StudentFormLayout } from "@/components/students/StudentFormLayout";
import { SuccessBanner } from "@/components/students/SuccessBanner";
import { useStudentForm } from "@/components/hooks/useStudentForm";

export default function EmployeeNewStudentPage() {
  const [success, setSuccess] = useState(false);
  const [createdName, setCreatedName] = useState("");

  const { data, errors, loading, setLoading, onChange, setError, validate } =
    useStudentForm({ mode: "create" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await studentService.create({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        telephone: data.telephone.trim(),
        institution: data.institution,
        shift: data.shift,
        password: data.password,
      });
      setCreatedName(data.name.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      if (error.status === 409) {
        setError("email", "Este email já está cadastrado no sistema");
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
    onChange("institution", "");
    onChange("shift", "");
    onChange("password", "");
    onChange("confirmPassword", "");
  };

  return (
    <main className="bg-surface p-8 min-h-[calc(100vh-4rem)] flex flex-col">
          <StudentFormLayout
            title="Cadastrar Estudante"
            subtitle="Preencha os dados para criar uma nova conta de estudante"
            backHref="/employee/students"
          >
            {success ? (
              <SuccessBanner
                title="Estudante cadastrado!"
                description={`A conta de ${createdName} foi criada com sucesso.`}
                backHref="/employee/students"
                backLabel="Ver estudantes"
                onReset={handleReset}
                resetLabel="Novo cadastro"
                resetIcon="person_add"
              />
            ) : (
              <StudentForm
                data={data}
                errors={errors}
                loading={loading}
                mode="create"
                onChange={onChange}
                onSubmit={handleSubmit}
              />
            )}
          </StudentFormLayout>

          <div className="mt-auto w-full">
            <Footer />
          </div>
    </main>
  );
}
