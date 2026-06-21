"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { getInitials } from "@/lib/utils/string";
import type { EmployeeUser } from "@/types/employeeAuth";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export interface SideNavBrand {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

interface SideNavProps {
  brand: SideNavBrand;
  items: readonly NavItem[];
  onLogout?: () => void;
}

export function SideNav({ brand, items, onLogout }: SideNavProps) {
  const pathname = usePathname();
  const { user } = useEmployeeAuth();
  const Brand = brand.icon;

  return (
    <aside className="hidden lg:flex h-dvh w-64 lg:sticky lg:top-0 bg-surface-container-lowest flex-col border-r border-outline-variant/30">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-outline-variant/20">
        <div className="size-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <Brand className="size-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-on-surface leading-tight">{brand.title}</p>
          <p className="text-xs text-on-surface-variant">{brand.subtitle}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/8 text-primary font-semibold border-r-2 border-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition-colors",
                      isActive ? "text-primary" : "text-on-surface-variant",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </aside>
  );
}

function UserFooter({
  user,
  onLogout,
}: {
  user: EmployeeUser | null;
  onLogout?: () => void;
}) {
  return (
    <div className="px-4 py-4 border-t border-outline-variant/20">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
          {user?.name ? getInitials(user.name) : "A"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate leading-tight">
            {user?.name ?? "Administrador"}
          </p>
          <p className="text-xs text-on-surface-variant">
            {user?.role === "admin" ? "Administradora" : "Funcionária"}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors shrink-0"
          title="Sair"
        >
          <LogOut className="size-4.5" />
        </button>
      </div>
    </div>
  );
}
