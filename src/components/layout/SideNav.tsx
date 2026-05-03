"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: "dashboard", label: "Painel", href: "/admin/dashboard" },
  { icon: "info", label: "Informações", href: "/admin/info" },
  { icon: "event", label: "Período de Inscrição", href: "/admin/enrollment-period" },
  { icon: "group", label: "Funcionários", href: "/admin/employees" },
  { icon: "school", label: "Estudantes", href: "/admin/students" },
  { icon: "badge", label: "Carteirinhas", href: "/admin/cards" },
  { icon: "account_balance", label: "Instituições", href: "/admin/universities" },
  { icon: "directions_bus", label: "Frota", href: "/admin/buses" },
];

interface SideNavProps {
  activePath?: string;
  onLogout?: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SideNav({ activePath, onLogout }: SideNavProps) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const { user } = useEmployeeAuth();

  return (
    <aside className="hidden lg:flex h-dvh w-64 lg:sticky lg:top-0 bg-surface-container-lowest flex-col border-r border-outline-variant/30">

      {/* Branding */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-outline-variant/20">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white" style={{ fontSize: "18px" }}>
            directions_bus
          </span>
        </div>
        <div>
          <p className="text-sm font-extrabold text-on-surface leading-tight">Transporte</p>
          <p className="text-xs text-on-surface-variant">São Fidélis · RJ</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 px-3 mb-2">
          Geral
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              currentPath === item.href || currentPath.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/8 text-primary font-semibold border-r-2 border-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined transition-colors",
                      isActive ? "text-primary" : "text-on-surface-variant"
                    )}
                    style={{ fontSize: "20px" }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {user?.name ? getInitials(user.name) : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate leading-tight">
              {user?.name ?? "Administrador"}
            </p>
            {user?.registrationId && (
              <p className="text-xs text-on-surface-variant">Mat. {user.registrationId}</p>
            )}
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors flex-shrink-0"
            title="Sair"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}