"use client";

import { GraduationCap, Users, ClipboardList, Bus } from "lucide-react";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";

interface DashboardStatCardsProps {
  activeStudents: number | null;
  activeEmployees: number | null;
  pendingStudents: number | null;
  fleetLabel: string | null;
  /** Funcionário vê apenas os cards focados em aluno. Default: "admin". */
  role?: "admin" | "employee";
}

export function DashboardStatCards({
  activeStudents,
  activeEmployees,
  pendingStudents,
  fleetLabel,
  role = "admin",
}: DashboardStatCardsProps) {
  const isAdmin = role === "admin";
  const base = isAdmin ? "/admin" : "/employee";

  return (
    <div className={`grid grid-cols-2 gap-4 ${isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-2"}`}>
      <DashboardStatCard
        icon={GraduationCap}
        label="Alunos ativos"
        value={activeStudents}
        href={`${base}/students`}
      />
      {isAdmin && (
        <DashboardStatCard
          icon={Users}
          label="Funcionários"
          value={activeEmployees}
          href="/admin/employees"
        />
      )}
      <DashboardStatCard
        icon={ClipboardList}
        label="Solicitações pendentes"
        value={pendingStudents}
        href={`${base}/cards`}
      />
      {isAdmin && (
        <DashboardStatCard
          icon={Bus}
          label="Frota em operação (vaga-dia)"
          value={fleetLabel ?? "-"}
          href="/admin/buses"
          tooltipContent="Vagas em vaga-dia: 1 vaga de ônibus equivale a 5 (segunda a sexta). O total é a soma das vagas dos ônibus ativos × 5."
          tooltipAriaLabel="O que é vaga-dia?"
        />
      )}
    </div>
  );
}
