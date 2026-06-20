"use client";

import { GraduationCap, Users, ClipboardList, Bus } from "lucide-react";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";

interface DashboardStatCardsProps {
  activeStudents: number | null;
  activeEmployees: number | null;
  pendingStudents: number | null;
  fleetLabel: string | null;
}

export function DashboardStatCards({
  activeStudents,
  activeEmployees,
  pendingStudents,
  fleetLabel,
}: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <DashboardStatCard
        icon={GraduationCap}
        label="Alunos ativos"
        value={activeStudents}
        href="/admin/students"
      />
      <DashboardStatCard
        icon={Users}
        label="Funcionários"
        value={activeEmployees}
        href="/admin/employees"
      />
      <DashboardStatCard
        icon={ClipboardList}
        label="Solicitações pendentes"
        value={pendingStudents}
        href="/admin/cards"
      />
      <DashboardStatCard
        icon={Bus}
        label="Frota em operação (vaga-dia)"
        value={fleetLabel ?? "—"}
        href="/admin/buses"
        tooltipContent="Vagas em vaga-dia: 1 vaga de ônibus equivale a 5 (segunda a sexta). O total é a soma das vagas dos ônibus ativos × 5."
        tooltipAriaLabel="O que é vaga-dia?"
      />
    </div>
  );
}
