"use client";

import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { StatsDashboard } from "@/components/stats/StatsDashboard";

export default function AdminInfoPage() {
  const { user } = useEmployeeAuth();

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav />

      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />

        <main className="flex-1 p-8">
          <StatsDashboard />
        </main>

        <Footer />
      </div>
    </div>
  );
}

