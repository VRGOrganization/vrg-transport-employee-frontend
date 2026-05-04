"use client";

import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { Pencil } from "lucide-react";

export default function AdminEmployeeEditPage() {
  const { user, logout } = useEmployeeAuth();

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav activePath="/admin/employees" onLogout={logout} />
      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />
        <main className="bg-surface p-8 min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-on-surface-variant">
            <Pencil className="w-14 h-14" />
            <h1 className="text-2xl font-semibold text-on-surface">Editar Funcionário</h1>
            <p>Em construção</p>
          </div>
          <div className="mt-auto w-full">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
