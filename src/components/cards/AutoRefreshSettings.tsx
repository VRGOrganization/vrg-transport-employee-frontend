"use client";

import { useState } from "react";
import { Settings, RefreshCw, HelpCircle } from "lucide-react";

interface AutoRefreshSettingsProps {
  isRefreshing: boolean;
  enabled: boolean;
  intervalSeconds: number;
  onToggle: () => void;
}

/**
 * Botão de configuração (engrenagem) no canto superior direito. Ao clicar,
 * revela um painel com o controle de atualização automática (Auto/Pausado).
 * O painel só fecha quando a engrenagem é clicada novamente.
 */
export function AutoRefreshSettings({
  isRefreshing,
  enabled,
  intervalSeconds,
  onToggle,
}: AutoRefreshSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Configurações de atualização"
        aria-expanded={open}
        title="Configurações"
        className={`flex size-9 cursor-pointer items-center justify-center rounded-xl border transition-colors ${
          open
            ? "border-primary bg-primary/10 text-primary"
            : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        }`}
      >
        <Settings
          className={`size-4 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Atualização automática
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                enabled
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-high/80"
              }`}
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing
                ? "Atualizando…"
                : enabled
                  ? `Auto (${intervalSeconds}s)`
                  : "Pausado"}
            </button>

            <span className="group relative inline-flex shrink-0">
              <HelpCircle className="size-4 cursor-help text-on-surface-variant transition-colors hover:text-on-surface" />
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-56 rounded-lg bg-on-surface px-3 py-2 text-[11px] leading-snug text-surface opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
              >
                {enabled
                  ? `A lista recarrega sozinha a cada ${intervalSeconds}s. Clique no botão para pausar e atualizar apenas quando quiser.`
                  : "A atualização automática está pausada. Clique no botão para retomar o recarregamento periódico."}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
