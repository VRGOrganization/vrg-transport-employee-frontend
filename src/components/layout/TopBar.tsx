"use client";

import { EmployeeUser } from "@/types/employeeAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { usePathname } from "next/navigation";

interface TopBarProps {
  user: EmployeeUser | null;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    "/admin/info": "Painel de Informações",
    "/admin/dashboard": "Painel Administrativo",
    "/admin/enrollment-period": "Período de Inscrição",
    "/admin/employees/new": "Criar Funcionário",
    "/admin/students": "Gerenciar Estudantes",
    "/admin/cards": "Gerenciar Carteirinhas",
    "/employee/dashboard": "Painel do Funcionário",
    "/employee/students": "Gerenciar Estudantes",
    "/employee/cards": "Gerenciar Carteirinhas",
    "/employee/info": "Estatísticas de Aluno",
  };

  // Verifica se é uma rota dinâmica (ex: /admin/students/123)
  for (const [path, title] of Object.entries(titles)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return title;
    }
  }

  return "Secretaria de Transporte de São Fidélis";
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="fixed top-0 right-0 left-64 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-outline-variant/30">
      <div className="flex justify-between items-center px-8 py-3 h-16">
        <h1 className="font-headline font-bold text-white text-lg">
          {pageTitle}
        </h1>

        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm font-medium text-slate-500 hidden md:block">
              {user.role === "admin" ? "Administrador" : "Funcionário"}: {user.name}
              {user.registrationId && (
                <span className="ml-1">| Matrícula: {user.registrationId}</span>
              )}
            </span>
          )}

          <ThemeToggle className="text-slate-500 hover:text-on-surface hover:bg-surface-container-high" />

          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border-2 border-primary-container">
            {user?.name ? getInitials(user.name) : "A"}
          </div>
        </div>
      </div>
    </header>
  );
}