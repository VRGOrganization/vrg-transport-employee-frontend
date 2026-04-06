"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { EmployeeUser } from "@/types/employeeAuth";

interface DashboardNavProps {
  user: EmployeeUser | null;
  onLogout: () => void;
}

export function DashboardNav({ user, onLogout }: DashboardNavProps) {
  const isAdmin = user?.role === "admin";

  return (
    <nav className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow-md flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
          directions_bus
        </span>
        <span className="font-headline font-semibold text-lg tracking-wide">
          Portal Interno
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm text-white/80 hidden sm:block">{user.name}</span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                isAdmin
                  ? "bg-warning/20 text-yellow-200 border border-yellow-300/30"
                  : "bg-white/10 text-blue-100 border border-white/20"
              }`}
            >
              {isAdmin ? "Administrador" : "Funcionário"}
            </span>
          </>
        )}
        <ThemeToggle className="text-white/80 hover:text-white hover:bg-white/10" />
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          title="Sair"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            logout
          </span>
          <span className="hidden sm:block">Sair</span>
        </button>
      </div>
    </nav>
  );
}
