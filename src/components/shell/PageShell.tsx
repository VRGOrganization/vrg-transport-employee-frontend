"use client";

import type { ReactNode } from "react";
import { SideNav, type NavItem, type SideNavBrand } from "./SideNav";
import { TopBar } from "./TopBar";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";

interface PageShellProps {
  brand: SideNavBrand;
  navItems: readonly NavItem[];
  children: ReactNode;
}

export function PageShell({ brand, navItems, children }: PageShellProps) {
  const { logout } = useEmployeeAuth();

  return (
    <div className="min-h-screen w-full bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav brand={brand} items={navItems} onLogout={logout} />
      <div className="min-w-0 w-full flex flex-col">
        <TopBar />
        {children}
      </div>
    </div>
  );
}
