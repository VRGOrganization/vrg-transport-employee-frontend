"use client";

import { useState } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { employeeApi } from "@/lib/employeeApi";

import { StudentForm } from "@/components/students/StudentForm";
import { StudentFormLayout } from "@/components/students/StudentFormLayout";
import { SuccessBanner } from "@/components/students/SuccessBanner";
import { useStudentForm } from "@/components/hooks/useStudentForm";

export default function NewStudentPage() {
  const { user, logout } = useEmployeeAuth();
  const [success, setSuccess] = useState(false);
  const [createdName, setCreatedName] = useState("");

  const { data, errors, loading, setLoading, onChange, setError, validate } =
    useStudentForm({ mode: "create" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await employeeApi.post("/student", {
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
    <div className="flex min-h-screen bg-surface">
      <SideNav activePath="/admin/students" onLogout={logout} />

      <div className="flex-1 ml-64 flex flex-col">
        <TopBar user={user} />

        <main className="mt-16 p-8 bg-surface min-h-[calc(100vh-4rem)]">
          <StudentFormLayout
            title="Cadastrar Estudante"
            subtitle="Preencha os dados para criar uma nova conta de estudante"
            backHref="/admin/students"
          >
            {success ? (
              <SuccessBanner
                title="Estudante cadastrado!"
                description={`A conta de ${createdName} foi criada com sucesso.`}
                backHref="/admin/students"
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
          
        </main>
      </div>
    </div>
  );
}