"use client";

import type { ReactNode } from "react";
import { SideNav, type NavItem, type SideNavBrand } from "./SideNav";
import { TopBar } from "./TopBar";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";

interface PageShellProps {
  brand: SideNavBrand;
  navItems: readonly NavItem[];
  showUserFooter?: boolean;
  children: ReactNode;
}

export function PageShell({ brand, navItems, showUserFooter, children }: PageShellProps) {
  const { user, logout } = useEmployeeAuth();

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav brand={brand} items={navItems} onLogout={logout} showUserFooter={showUserFooter} />
      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />
        {children}
      </div>
    </div>
  );
}
