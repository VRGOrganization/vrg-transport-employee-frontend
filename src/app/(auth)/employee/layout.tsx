import { PageShell } from "@/components/shell/PageShell";
import { EMPLOYEE_NAV_ITEMS, EMPLOYEE_BRAND } from "@/components/shell/navConfig";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell brand={EMPLOYEE_BRAND} navItems={EMPLOYEE_NAV_ITEMS} showUserFooter={false}>
      {children}
    </PageShell>
  );
}
