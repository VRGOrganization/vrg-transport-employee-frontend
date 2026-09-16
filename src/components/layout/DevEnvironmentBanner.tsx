"use client";

export function DevEnvironmentBanner() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== "development") return null;

  return (
    <div className="fixed bottom-1 left-1 z-[var(--z-toast)] pointer-events-none rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-white shadow">
      Servidor de desenvolvimento
    </div>
  );
}
