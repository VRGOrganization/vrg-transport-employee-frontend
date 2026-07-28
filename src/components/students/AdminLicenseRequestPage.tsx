"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminLicenseRequestForm } from "@/components/students/AdminLicenseRequestForm";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { studentService } from "@/services/studentService";
import { http } from "@/services/http";
import type { LicenseRequestRecord } from "@/types/cards.types";

interface AdminLicenseRequestPageProps {
  role: "admin" | "employee";
}

// Status que representam um pedido ainda em andamento: já existe algo pra
// resolver antes de fazer sentido abrir um pedido novo pro mesmo aluno.
const IN_FLIGHT_STATUS_LABELS: Partial<Record<LicenseRequestRecord["status"], string>> = {
  pending: "pendente de análise",
  revision: "aguardando revisão do aluno",
  waitlisted: "na fila de espera",
};

/**
 * Página do fluxo interno de criação de pedido de carteirinha, a partir de um
 * aluno já cadastrado (studentId via query `?id=`).
 */
export function AdminLicenseRequestPage({ role }: AdminLicenseRequestPageProps) {
  const backHref = role === "admin" ? "/admin/students" : "/employee/students";
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [studentName, setStudentName] = useState<string | undefined>(undefined);
  const [studentError, setStudentError] = useState("");
  const [checkingPending, setCheckingPending] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<LicenseRequestRecord | null>(null);

  useEffect(() => {
    if (!studentId) return;
    studentService
      .getById(studentId)
      .then((s) => setStudentName(s.name))
      .catch(() => setStudentError("Não foi possível carregar os dados deste aluno. Verifique se o link está correto."));
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    // Sincronização com API externa (fetch on mount/dependency change) — o
    // extra render de "checando" é o custo aceito desse padrão.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckingPending(true);
    http
      .get<LicenseRequestRecord[]>(`/license-request/student/${studentId}`)
      .then((requests) => {
        const inFlight = requests.find((r) => r.status in IN_FLIGHT_STATUS_LABELS);
        setPendingRequest(inFlight ?? null);
      })
      .catch(() => setPendingRequest(null))
      .finally(() => setCheckingPending(false));
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
          {!studentId ? (
            <StatusBanner variant="error">
              Aluno não informado. Acesse este fluxo a partir do cadastro de um aluno.
            </StatusBanner>
          ) : studentError ? (
            <StatusBanner variant="error">{studentError}</StatusBanner>
          ) : checkingPending ? (
            <p className="text-sm text-on-surface-variant">Verificando pedidos em andamento…</p>
          ) : pendingRequest ? (
            <StatusBanner variant="error">
              {studentName ? <strong>{studentName}</strong> : "Este aluno"} já tem um pedido de
              carteirinha {IN_FLIGHT_STATUS_LABELS[pendingRequest.status]}. Resolva esse pedido
              (na fila de revisão) antes de criar um novo.
            </StatusBanner>
          ) : (
            <AdminLicenseRequestForm studentId={studentId} studentName={studentName} />
          )}
        </div>
      </div>

      <div className="mt-auto w-full">
        <Footer />
      </div>
    </main>
  );
}
