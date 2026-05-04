"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, GraduationCap, IdCard, BarChart2, LogOut, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Painel do Funcionário", href: "/employee/dashboard" },
  { icon: GraduationCap,   label: "Gerenciar Estudantes",  href: "/employee/students"  },
  { icon: IdCard,          label: "Gerenciar Carteirinhas",href: "/employee/cards"     },
  { icon: BarChart2,       label: "Estatísticas de Aluno", href: "/employee/info"      },
];

interface EmployeeSideNavProps {
  activePath?: string;
  onLogout?: () => void;
}

export function EmployeeSideNav({ activePath, onLogout }: EmployeeSideNavProps) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <aside className="hidden h-dvh w-64 lg:sticky lg:top-0 bg-surface-container-lowest lg:flex flex-col py-6 border-r border-outline-variant/30">
      {/* Branding */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-black text-on-surface leading-tight font-headline">
            Área do Funcionário
          </h2>
          <p className="text-xs font-medium text-on-surface-variant">São Fidélis - RJ</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            currentPath === item.href ||
            currentPath.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium font-body",
                isActive
                  ? "bg-primary/8 text-primary border-r-2 border-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
              )}
            >
              <Icon className="w-5.5 h-5.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="px-4 pt-6 border-t border-outline-variant/20">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-all duration-200 text-sm font-medium"
        >
          <LogOut className="w-5.5 h-5.5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
