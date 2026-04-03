"use client";

import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardCard } from "@/components/ui/DashboardCard";

export default function AdminDashboard() {
  const { user, logout } = useEmployeeAuth();

  return (
    <div className="flex flex-col flex-1">
      <DashboardNav user={user} onLogout={logout} />

      <main className="flex-1 bg-surface px-6 py-8 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-headline font-bold text-2xl text-on-surface">
              Painel do Administrador
            </h1>
            <p className="text-on-surface-variant mt-1">
              Bem-vindo, <span className="font-medium text-on-surface">{user?.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DashboardCard
              icon="group"
              title="Gerenciamento de Funcionários"
              description="Cadastrar, editar e gerenciar funcionários do sistema."
              href="/admin/employees/new"
            />
            <DashboardCard
              icon="monitoring"
              title="Painel de Informações"
              description="Visualizar estatísticas e informações gerais do sistema."
              href="/admin/info"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
