"use client";

import { GraduationCap, Users, ClipboardList, Bus } from "lucide-react";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";

export interface DashboardStats {
  activeStudents: number | null;
  activeEmployees: number | null;
  inactiveEmployees: number | null;
  pendingStudents: number | null;
  fleetLabel: string | null;
}

interface DashboardStatCardsProps {
  stats: DashboardStats;
}

export function DashboardStatCards({ stats }: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <DashboardStatCard
        icon={GraduationCap}
        label="Alunos ativos"
        value={stats.activeStudents}
        href="/admin/students"
      />
      <DashboardStatCard
        icon={Users}
        label="Funcionários"
        value={stats.activeEmployees}
        href="/admin/employees"
      />
      <DashboardStatCard
        icon={ClipboardList}
        label="Solicitações pendentes"
        value={stats.pendingStudents}
        href="/admin/cards"
      />
      <DashboardStatCard
        icon={Bus}
        label="Frota em operação"
        value={stats.fleetLabel ?? "—"}
        href="/admin/buses"
      />
    </div>
  );
}
