import { EmployeeAdminHeader } from "@/components/auth/EmployeeAdminHeader";
import { EmployeeAdminLoginForm } from "@/components/auth/EmployeeAdminLoginForm";

export default function EmployeeAdminLoginPage() {
  return (
    <>
      <EmployeeAdminHeader />
      <main className="flex-1 -mt-12 bg-surface rounded-t-[2.5rem] relative z-20 px-6 pt-8 pb-12 shadow-[0_-12px_40px_var(--shadow-primary-soft)]">
        <div className="max-w-md mx-auto">
          <EmployeeAdminLoginForm />
        </div>
      </main>
    </>
  );
}