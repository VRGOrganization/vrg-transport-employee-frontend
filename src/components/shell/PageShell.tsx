"use client";

import { type ReactNode, useState, useEffect } from "react";
import { SideNav, type NavItem, type SideNavBrand } from "./SideNav";
import { TopBar } from "./TopBar";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";

const STORAGE_KEY = "sidenav-collapsed";

interface PageShellProps {
  brand: SideNavBrand;
  navItems: readonly NavItem[];
  children: ReactNode;
}

export function PageShell({ brand, navItems, children }: PageShellProps) {
  const { logout } = useEmployeeAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  };

  return (
    <div className="min-h-screen w-full bg-surface flex">
      <SideNav brand={brand} items={navItems} onLogout={logout} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        {children}
      </div>
    </div>
  );
}
