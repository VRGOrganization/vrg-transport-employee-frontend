"use client";
 
import { EmployeeUser } from "@/types/employeeAuth";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
 
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
    "/admin/dashboard": "Painel Administrativo",
    "/admin/info": "Informações",
    "/admin/enrollment-period": "Período de Inscrição",
    "/admin/employees": "Funcionários",
    "/admin/employees/new": "Novo Funcionário",
    "/admin/students": "Estudantes",
    "/admin/cards": "Carteirinhas",
    "/admin/universities": "Instituições",
    "/admin/buses": "Frota",
    "/employee/dashboard": "Painel",
    "/employee/students": "Estudantes",
    "/employee/cards": "Carteirinhas",
  };
 
  for (const [path, title] of Object.entries(titles)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  return "Painel Administrativo";
}
 
export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
 
  return (
    <header className="sticky top-0 z-30 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30">
      <div className="flex items-center justify-between h-full px-8">
 
        {/* Left: page title */}
        <h1 className="text-base font-bold text-on-surface">{pageTitle}</h1>
 
        {/* Right: actions */}
        <div className="flex items-center gap-2">
        
 
          {/* Theme toggle */}
          <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
 
          {/* Divider */}
          <div className="w-px h-6 bg-outline-variant/40 mx-1" />
 
          {/* User info */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface leading-tight">
                {user?.name ?? "Administrador"}
              </p>
              <p className="text-xs text-on-surface-variant">
                {user?.role === "admin" ? "Administradora" : "Funcionária"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shrink-0">
              {user?.name ? getInitials(user.name) : "A"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
