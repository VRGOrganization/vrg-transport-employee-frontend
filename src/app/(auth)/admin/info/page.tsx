"use client";

import { useState } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";

import { InfoSummaryCards } from "@/components/info/InfoSummaryCards";
import { TripDistributionChart } from "@/components/info/TripDistributionChart";
import { FleetStatus } from "@/components/info/FleetStatus";
import { InstitutionFilter } from "@/components/info/InstitutionFilter";

// Dados estáticos — substitua por chamadas reais à API conforme necessário
const STATS = {
  totalStudents: 1248,
  dayStudents: 842,
  nightStudents: 406,
  pendingRequests: 24,
};

export default function InfoPage() {
  const { user, logout } = useEmployeeAuth();
  const [institution, setInstitution] = useState("Todas as Instituições");

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Navegação lateral */}
      <SideNav activePath="/admin/info" onLogout={logout} />

      {/* Conteúdo principal */}
      <div className="flex-1 ml-64 flex flex-col">
        <TopBar user={user} />

        <main className="mt-16 p-8 bg-surface min-h-[calc(100vh-4rem)] space-y-8">
          {/* Cabeçalho da página + Filtro */}
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-extrabold font-headline text-primary tracking-tight padding-0">
               Visão geral do monitoramento estudantil e logística de frota.
              </h1>
              
            </div>
            <InstitutionFilter value={institution} onChange={setInstitution} />
          </div>

          {/* Cards de resumo */}
          <InfoSummaryCards {...STATS} />

          {/* Gráfico + coluna lateral */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TripDistributionChart />
            </div>

            <div className="space-y-6">
              <FleetStatus />
            </div>
          </div>

          <div className="bottom-0 left-0 w-full">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}