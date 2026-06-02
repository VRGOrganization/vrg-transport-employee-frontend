import { EmployeeAdminLoginForm } from "@/components/auth/EmployeeAdminLoginForm";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Bus } from "lucide-react";

export default function EmployeeAdminLoginPage() {
  return (
    <>
      {/* LEFT PANEL */}
      <aside className="hidden lg:flex lg:w-[46%] flex-col bg-primary relative overflow-hidden">
        {/* Diagonal grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 28px,
              rgba(255,255,255,0.35) 28px,
              rgba(255,255,255,0.35) 30px
            )`,
          }}
        />

        {/* Soft glow blobs */}
        <div className="absolute top-[-80px] right-[-80px] size-80 bg-primary-container/25 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] size-72 bg-primary-container/15 rounded-full blur-3xl" />

        {/* Logo / Brand */}
        <div className="relative z-10 p-8">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-surface/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-surface/20">
              <Bus className="size-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Transporte</p>
              <p className="text-primary-fixed-dim text-xs">São Fidélis · RJ</p>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <AuthPageShell
        eyebrow="Acessar Conta"
        title="Entrar no sistema"
        subtitle="Use sua matrícula ou e-mail institucional."
        topRight={
          <ThemeToggle className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface" />
        }
      >
        <EmployeeAdminLoginForm />
      </AuthPageShell>
    </>
  );
}
