"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        disabled
        className={`p-2 rounded-full transition-colors opacity-70 ${className}`}
        title="Alternar tema"
        aria-label="Alternar tema"
      >
        <Moon size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-full transition-colors active:scale-95 ${className}`}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
