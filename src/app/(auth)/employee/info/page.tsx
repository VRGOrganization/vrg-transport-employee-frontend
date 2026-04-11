"use client";

import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { StatsDashboard } from "@/components/stats/StatsDashboard";

export default function EmployeeInfoPage() {
  const { user } = useEmployeeAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SideNav />
      <TopBar user={user} />

      <main className="ml-64 flex-1 p-8">
        <StatsDashboard />
      </main>

     
    </div>
  );
}