"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    "/admin/dashboard":        "Painel Administrativo",
    "/admin/info":             "Informações",
    "/admin/enrollment-period":"Período de Inscrição",
    "/admin/employees":        "Funcionários",
    "/admin/students":         "Estudantes",
    "/admin/cards":            "Carteirinhas",
    "/admin/universities":     "Instituições",
    "/admin/buses":            "Frota",
    "/admin/priority-rules":   "Regras de Prioridade",
    "/admin/bus-pass/manifest":"Manifesto de passes",
    "/admin/bus-pass/settings":"Configurações do passe",
    "/admin/system-notice-templates": "Mensagens de sistema",
    "/admin/bus-pass":         "Passes de ônibus",
    "/employee/dashboard":     "Painel",
    "/employee/students":      "Estudantes",
    "/employee/cards":         "Carteirinhas",
    "/employee/buses":         "Frota",
    "/employee/system-notice-templates": "Mensagens de sistema",
    "/employee/bus-pass/manifest": "Manifesto de passes",
    "/employee/bus-pass":      "Passes de ônibus",
  };

  for (const [path, title] of Object.entries(titles)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  return "Painel Administrativo";
}

export function TopBar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-[var(--z-sticky-header)] h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30">
      <div className="flex items-center justify-between h-full px-8">
        <h1 className="text-base font-bold text-on-surface">{pageTitle}</h1>

        <div className="flex items-center gap-2">
          <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
        </div>
      </div>
    </header>
  );
}
