import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Bus } from "@/types/university.types";
import { AutoRefreshIndicator } from "./AutoRefreshIndicator";
import { BusCapacityBadge } from "./BusCapacityBadge";

interface BusPageHeaderProps {
  bus: Bus;
  onRefresh: () => void;
  onBack: () => void;
  isRefreshing: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
}

/**
 * Header contextual exibido quando um ônibus está selecionado, substituindo
 * o CardsPageHeader genérico.
 */
export function BusPageHeader({
  bus,
  onRefresh,
  onBack,
  isRefreshing,
  autoRefreshEnabled,
  onToggleAutoRefresh,
}: BusPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para a lista de ônibus"
          className="flex size-9 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Ônibus {bus.identifier} · {bus.shift ?? "—"}
          </h1>
          <p className="text-sm text-on-surface-variant">
            Gerencie as carteirinhas deste ônibus.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AutoRefreshIndicator
          isRefreshing={isRefreshing}
          enabled={autoRefreshEnabled}
          intervalSeconds={30}
          onToggle={onToggleAutoRefresh}
        />
        <BusCapacityBadge bus={bus} />
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          icon={<RefreshCw className="size-4" />}
        >
          Atualizar
        </Button>
      </div>
    </div>
  );
}
