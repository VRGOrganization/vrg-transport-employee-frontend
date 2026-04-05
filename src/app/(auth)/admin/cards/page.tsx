"use client";

import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";

export default function AdminCardsPage() {
  const { user } = useEmployeeAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SideNav />
      <TopBar user={user} />
      <main className="ml-64 flex-1 p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
          <span className="material-icons text-6xl">badge</span>
          <h1 className="text-2xl font-semibold">Gerenciar Carteirinhas</h1>
          <p>Em construção</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
