import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";

interface AuthPageShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthPageShell({ eyebrow, title, subtitle, children }: AuthPageShellProps) {
  return (
    <main className="flex-1 flex flex-col bg-surface">
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">{title}</h1>
          {subtitle && (
            <p className="text-sm text-on-surface-variant mb-8">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
      <Footer />
    </main>
  );
}
