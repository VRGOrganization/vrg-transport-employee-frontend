import { EmployeeAdminLoginForm } from "@/components/auth/EmployeeAdminLoginForm";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

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
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-primary-container/25 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-primary-container/15 rounded-full blur-3xl" />

        {/* Logo / Brand */}
        <div className="relative z-10 p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-surface/20">
              <span className="material-symbols-outlined text-white text-xl">
                directions_bus
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Transporte</p>
              <p className="text-primary-fixed-dim text-xs">São Fidélis · RJ</p>
            </div>
          </div>
        </div>
        <div 
        className="mt-auto w-full">
          <Footer/>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex-1 flex flex-col bg-surface">
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            {/* Eyebrow */}
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Acessar Conta
            </p>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
              Entrar no sistema
            </h1>
            <p className="text-sm text-on-surface-variant mb-8">
              Use sua matrícula ou e-mail institucional.
            </p>

            <EmployeeAdminLoginForm />
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
