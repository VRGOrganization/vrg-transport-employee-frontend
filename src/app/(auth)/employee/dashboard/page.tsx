"use client";

import { useEffect, useState } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { StatCard } from "@/components/ui/StatCard";
import { employeeApi } from "@/lib/employeeApi";

interface StudentStats {
  total: number;
  withCard: number;
  withoutCard: number;
  queue: number;
}

export default function EmployeeDashboard() {
  const { user, logout } = useEmployeeAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    employeeApi
      .get<StudentStats>("/student/stats")
      .then(setStats)
      .catch(() => {
        // endpoint não disponível ainda — mantém stats nulas
      });
  }, []);

  return (
    <div className="flex flex-col flex-1">
      <DashboardNav user={user} onLogout={logout} />

      <main className="flex-1 bg-surface px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard
              icon="group"
              label="Total de Alunos"
              value={stats?.total ?? null}
              accent="primary"
            />
            <StatCard
              icon="badge"
              label="Com Carteirinha"
              value={stats?.withCard ?? null}
              accent="success"
            />
            <StatCard
              icon="badge"
              label="Sem Carteirinha"
              value={stats?.withoutCard ?? null}
              accent="error"
            />
            <StatCard
              icon="hourglass_top"
              label="Fila de Espera"
              value={stats?.queue ?? null}
              accent="warning"
            />
          </div>

          <div className="mb-8">
            <h1 className="font-headline font-bold text-2xl text-on-surface">
              Dashboard
            </h1>
            <p className="text-on-surface-variant mt-1">
              Bem-vindo, <span className="font-medium text-on-surface">{user?.name}</span>
              {user?.registrationId && (
                <span className="ml-2 text-sm">· Matrícula: {user.registrationId}</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DashboardCard
              icon="school"
              title="Gerenciar Estudantes"
              description="Visualizar e editar cadastros de alunos matriculados."
              href="/employee/students"
            />
            <DashboardCard
              icon="id_card"
              title="Gerenciar Carteirinha"
              description="Emitir e revisar carteirinhas de transporte dos alunos."
              href="/employee/cards"
            />
            <DashboardCard
              icon="bar_chart"
              title="Estatísticas de Aluno"
              description="Acompanhar dados e relatórios sobre os alunos."
              href="/employee/stats"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
