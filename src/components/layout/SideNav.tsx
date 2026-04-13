"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: "dashboard", label: "Painel Administrativo", href: "/admin/dashboard" },
  { icon: "info", label: "Painel de Informações", href: "/admin/info" },
  { icon: "event", label: "Período de Inscrição", href: "/admin/enrollment-period" },
  { icon: "person_add", label: "Gerenciar Funcionário", href: "/admin/employees" },
  { icon: "school", label: "Gerenciar Estudantes", href: "/admin/students" },
  { icon: "badge", label: "Gerenciar Carteirinhas", href: "/admin/cards" },
  { icon: "account_balance", label: "Gerenciar Instituições", href: "/admin/universities" },
  { icon: "directions_bus", label: "Gerenciar Ônibus", href: "/admin/buses" }
];

interface SideNavProps {
  activePath?: string;
  onLogout?: () => void;
}

export function SideNav({ activePath, onLogout }: SideNavProps) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 flex flex-col py-6 z-40 border-r border-outline-variant/30">
      {/* Branding */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>
            settings
          </span>
        </div>
        <div>
          <h2 className="text-base font-black text-blue-900 dark:text-blue-50 leading-tight font-headline">
            Página do Administrador
          </h2>
          <p className="text-xs font-medium text-slate-500">São Fidélis - RJ</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium font-body",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-4 border-secondary"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
              )}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="px-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-error hover:bg-error-container transition-all duration-200 text-sm font-medium"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
            logout
          </span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}