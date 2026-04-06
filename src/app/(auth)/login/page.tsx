import { EmployeeAdminHeader } from "@/components/auth/EmployeeAdminHeader";
import { EmployeeAdminLoginForm } from "@/components/auth/EmployeeAdminLoginForm";
import { Footer } from "@/components/layout/Footer";

export default function EmployeeAdminLoginPage() {
  return (
    <>
      <EmployeeAdminHeader />
      <main className="flex-1 -mt-12 bg-surface rounded-t-[2.5rem] relative z-20 px-6 pt-8 pb-12 shadow-[0_-12px_40px_var(--shadow-primary-soft)]">
        <div className="max-w-md mx-auto">
          <EmployeeAdminLoginForm />
        </div>
        <div 
        className="absolute bottom-0 left-0 w-full">
          <Footer/>
        </div>
      </main>
    </>
  );
}