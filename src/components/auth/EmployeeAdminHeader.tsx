"use client";

import { ThemeToggle } from "../ui/ThemeToggle";


export function EmployeeAdminHeader() {
  return (
    <header className="relative bg-primary pt-16 pb-24 px-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/20 rounded-full -mr-20 -mt-20 blur-3xl" />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="text-surface-container-lowest/80 hover:bg-surface-container-lowest/10 hover:text-surface-container-lowest" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-surface-container-lowest/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-surface-container-lowest/20">
          <span className="material-symbols-outlined text-white text-4xl">
            admin_panel_settings
          </span>
        </div>

        <h1 className="text-white text-2xl font-extrabold tracking-tight mb-3">
          Portal Interno
        </h1>

        <p className="text-primary-fixed-dim text-sm max-w-[260px] leading-relaxed font-medium">
          Acesso exclusivo para servidores e administradores.
        </p>
      </div>
    </header>
  );
}