"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminLicenseRequestForm } from "@/components/students/AdminLicenseRequestForm";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { studentService } from "@/services/studentService";

interface AdminLicenseRequestPageProps {
  role: "admin" | "employee";
}

/**
 * Página do fluxo interno de criação de pedido de carteirinha, a partir de um
 * aluno já cadastrado (studentId via query `?id=`).
 */
export function AdminLicenseRequestPage({ role }: AdminLicenseRequestPageProps) {
  const backHref = role === "admin" ? "/admin/students" : "/employee/students";
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [studentName, setStudentName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!studentId) return;
    studentService
      .getById(studentId)
      .then((s) => setStudentName(s.name))
      .catch(() => {});
  }, [studentId]);

  return (
    <main className="px-6 py-5 bg-surface min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="w-full">
        <PageHeader
          back={backHref}
          title="Novo pedido de carteirinha (interno)"
          subtitle="Cria um pedido em nome de um aluno já cadastrado. Faculdade e curso podem ser digitados livremente."
        />

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          {studentId ? (
            <AdminLicenseRequestForm studentId={studentId} studentName={studentName} />
          ) : (
            <StatusBanner variant="error">
              Aluno não informado. Acesse este fluxo a partir do cadastro de um aluno.
            </StatusBanner>
          )}
        </div>
      </div>

      <div className="mt-auto w-full">
        <Footer />
      </div>
    </main>
  );
}
