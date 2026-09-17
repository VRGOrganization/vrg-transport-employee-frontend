"use client";

import { useEffect, useState } from "react";
import { Bus as BusIcon } from "lucide-react";
import { PanelCard } from "@/components/ui/PanelCard";
import {
  licenseRequestService,
  type BusRequestQueueEntry,
} from "@/services/licenseRequestService";

interface BusQueueSelectorPanelProps {
  onChange: (bus: BusRequestQueueEntry) => void;
  className?: string;
}

/**
 * Lista de ônibus da visão por ônibus da fila de carteirinhas, com as
 * contagens do ciclo ativo. Só leitura: não usa as rotas de admin de /bus.
 */
export default function BusQueueSelectorPanel({ onChange, className }: BusQueueSelectorPanelProps) {
  const [buses, setBuses] = useState<BusRequestQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const mountState = { cancelled: false };

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await licenseRequestService.getBusQueue();
        if (!mountState.cancelled) setBuses(data.buses ?? []);
      } catch {
        if (!mountState.cancelled) setError("Não foi possível carregar os ônibus");
      } finally {
        if (!mountState.cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      mountState.cancelled = true;
    };
  }, []);

  return (
    <PanelCard as="div" className={className}>
      <div className="mb-3 text-sm text-on-surface-variant">Ônibus</div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl border border-outline-variant bg-surface p-3" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {buses.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <BusIcon className="size-10 text-on-surface-variant/30" />
              <p className="text-sm font-medium text-on-surface-variant">Nenhum ônibus ativo</p>
              <p className="text-xs text-on-surface-muted">
                Cadastre ônibus para revisar carteirinhas por ônibus.
              </p>
            </div>
          )}

          {buses.map((bus) => (
            <button
              key={bus.busId}
              type="button"
              onClick={() => onChange(bus)}
              className="w-full cursor-pointer rounded-xl border border-outline-variant bg-surface p-3 text-left transition hover:border-primary hover:bg-surface-container-low"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-on-surface">
                    Ônibus {bus.identifier}
                    {bus.shift && <span className="text-on-surface-variant"> · {bus.shift}</span>}
                  </div>
                  <div className="truncate text-xs text-on-surface-variant">
                    {bus.capacity != null && `${bus.capacity} vagas por dia`}
                    {bus.capacity != null && bus.universities.length > 0 && " · "}
                    {bus.universities.map((university) => university.acronym).join(", ")}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {bus.pendingCount} pendentes
                  </span>
                  {bus.waitlistedCount > 0 && (
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                      {bus.waitlistedCount} em fila
                    </span>
                  )}
                  {bus.revisionCount > 0 && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                      {bus.revisionCount} em revisão
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}

          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
      )}
    </PanelCard>
  );
}
