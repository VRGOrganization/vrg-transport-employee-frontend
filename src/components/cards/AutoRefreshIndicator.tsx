import { RefreshCw } from "lucide-react";

interface AutoRefreshIndicatorProps {
  isRefreshing: boolean;
  enabled: boolean;
  refreshCount: number;
  intervalSeconds: number;
  onToggle: () => void;
}

export function AutoRefreshIndicator({
  isRefreshing,
  enabled,
  refreshCount: _refreshCount,
  intervalSeconds,
  onToggle,
}: AutoRefreshIndicatorProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={
        enabled
          ? "Clique para pausar atualização automática"
          : "Clique para ativar atualização automática"
      }
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
        enabled
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-high/80"
      }`}
    >
      <RefreshCw
        className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
      />
      {isRefreshing
        ? "Atualizando…"
        : enabled
          ? `Auto (${intervalSeconds}s)`
          : "Pausado"}
    </button>
  );
}
