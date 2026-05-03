"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { busRouteApi } from "@/lib/universityApi";
import type { BusRoute } from "@/types/university.types";

interface BusRouteSelectorPanelProps {
  value?: string | null;
  onChange?: (route: BusRoute | null) => void;
  className?: string;
}

function summarizeDestinations(route: BusRoute): string {
  const activeDestinations = (route.destinations ?? []).filter((destination) => destination.active);
  if (activeDestinations.length === 0) {
    return "Nenhum destino ativo";
  }

  return activeDestinations.map((destination) => destination.name).join(" · ");
}

export default function BusRouteSelectorPanel({
  value = null,
  onChange,
  className,
}: BusRouteSelectorPanelProps) {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await busRouteApi.list();
        const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
        if (!cancelled) setRoutes(data as BusRoute[]);
      } catch (err) {
        if (!cancelled) setError("Não foi possível carregar as rotas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => routes.find((route) => route._id === value) ?? null,
    [routes, value],
  );

  return (
    <div className={`${className ?? ""} rounded-2xl border border-outline-variant bg-surface-container-lowest p-4`}>
      <div className="mb-3 text-sm text-on-surface-variant">Rota para aprovação</div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-surface p-3 border border-outline-variant" />
          ))}
        </div>
      ) : !value ? (
        <div className="space-y-2">
          {routes.map((route) => (
            <button
              key={route._id}
              type="button"
              onClick={() => onChange?.(route)}
              className="w-full text-left rounded-xl border p-3 bg-surface hover:border-primary transition flex items-start justify-between gap-3 border-outline-variant"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-on-surface">{route.lineNumber}</div>
                  {!route.active && (
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      Inativa
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-start gap-2 text-xs text-on-surface-variant">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-2">{summarizeDestinations(route)}</span>
                </div>
              </div>
            </button>
          ))}

          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-on-surface-variant">Rota selecionada</div>
            <div className="text-base font-semibold text-on-surface">{selected?.lineNumber ?? "–"}</div>
            <div className="mt-1 flex items-start gap-2 text-xs text-on-surface-variant">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{selected ? summarizeDestinations(selected) : ""}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange?.(null)}
            className="rounded-md bg-surface-container-low px-3 py-2 text-sm hover:bg-surface-container transition"
          >
            Limpar
          </button>
        </div>
      )}
    </div>
  );
}
