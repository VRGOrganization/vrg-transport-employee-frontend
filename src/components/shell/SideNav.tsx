"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
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
  collapsed?: boolean;
  onToggle?: () => void;
}

export function SideNav({ brand, items, onLogout, collapsed = false, onToggle }: SideNavProps) {
  const pathname = usePathname();
  const { user } = useEmployeeAuth();
  const Brand = brand.icon;

  return (
    <aside
      className={cn(
        "hidden lg:flex h-dvh lg:sticky lg:top-0 z-[var(--z-sticky-header)] bg-surface-container-lowest flex-col border-r border-outline-variant/30 transition-[width] duration-200 ease-in-out shrink-0 overflow-visible relative",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Brand header */}
      <div
        className={cn(
          "relative py-5 flex items-center border-b border-outline-variant/20 shrink-0",
          collapsed ? "justify-center px-2" : "px-5 gap-3",
        )}
      >
        {onToggle && (
          <button
            onClick={onToggle}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="absolute -bottom-3.5 -right-3.5 z-[var(--z-drawer)] size-7 rounded-full bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low shadow-sm transition-colors"
          >
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        )}
        <div className="size-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <Brand className="size-4.5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-on-surface leading-tight truncate">{brand.title}</p>
            <p className="text-xs text-on-surface-variant truncate">{brand.subtitle}</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                    collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-primary/8 text-primary font-semibold border-r-2 border-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-on-surface-variant",
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <UserFooter user={user} onLogout={onLogout} collapsed={collapsed} />
    </aside>
  );
}

function UserFooter({
  user,
  onLogout,
  collapsed,
}: {
  user: EmployeeUser | null;
  onLogout?: () => void;
  collapsed?: boolean;
}) {
  const initials = user?.name ? getInitials(user.name) : "A";

  if (collapsed) {
    return (
      <div className="px-2 py-4 border-t border-outline-variant/20 flex flex-col items-center gap-2">
        <div
          className="size-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0"
          title={user?.name ?? "Administrador"}
        >
          {initials}
        </div>
        <button
          onClick={onLogout}
          className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
          title="Sair"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t border-outline-variant/20">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
          {initials}
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
