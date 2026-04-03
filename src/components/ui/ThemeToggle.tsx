"use client";

import { useTheme } from "@/providers/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-full transition-colors active:scale-95 ${className}`}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px", display: "block" }}>
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
