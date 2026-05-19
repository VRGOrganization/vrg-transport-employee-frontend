"use client";

import { PageShell } from "@/components/shell/PageShell";
import { ADMIN_NAV_ITEMS, ADMIN_BRAND } from "@/components/shell/navConfig";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell brand={ADMIN_BRAND} navItems={ADMIN_NAV_ITEMS}>
      {children}
    </PageShell>
  );
}
