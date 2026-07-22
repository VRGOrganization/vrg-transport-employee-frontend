"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { SideNav, type NavItem, type SideNavBrand } from "./SideNav";
import { TopBar } from "./TopBar";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";

const STORAGE_KEY = "sidenav-collapsed";
const collapsedListeners = new Set<() => void>();

function getCollapsedSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

function subscribeToCollapsed(callback: () => void) {
  collapsedListeners.add(callback);
  return () => collapsedListeners.delete(callback);
}

function setCollapsedPreference(value: boolean) {
  localStorage.setItem(STORAGE_KEY, String(value));
  collapsedListeners.forEach((listener) => listener());
}

interface PageShellProps {
  brand: SideNavBrand;
  navItems: readonly NavItem[];
  children: ReactNode;
}

export function PageShell({ brand, navItems, children }: PageShellProps) {
  const { logout } = useEmployeeAuth();
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  const toggle = () => {
    setCollapsedPreference(!collapsed);
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
