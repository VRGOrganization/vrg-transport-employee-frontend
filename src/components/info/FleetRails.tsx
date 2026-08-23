"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/types/cards.types";
import { DAYS, type BusLoad, type InfoLens, type InfoMetric } from "@/types/info.types";
import type { BusPalette } from "@/lib/info/palette";
import { compareIdentifiers } from "@/lib/info/normalize";
import { formatNumber } from "@/lib/info/format";
import { FleetRail } from "./FleetRail";

type SortMode = "pico" | "identificador" | "media";

interface FleetRailsProps {
  fleet: BusLoad[];
  metric: InfoMetric;
  palette: BusPalette;
  lens: InfoLens;
  universityNames: Map<string, string>;
  capacityByBusDay: Map<string, { filled: number; capacity: number | null }>;
  busesActive: number;
  busesInactive: number;
  studentsTransported: number;
  dualEnrollment: number;
  onPatchLens: (patch: Partial<InfoLens>) => void;
  onOpenRoster: (busId: string, identifier: string) => void;
}

const SORT_LABEL: Record<SortMode, string> = {
  pico: "Pico",
  identificador: "Identificador",
  media: "Ocupação média",
};

/** A frota como trilhos: um ônibus por linha, a semana inteira lado a lado. */
export function FleetRails({
  fleet,
  metric,
  palette,
  lens,
  universityNames,
  capacityByBusDay,
  busesActive,
  busesInactive,
  studentsTransported,
  dualEnrollment,
  onPatchLens,
  onOpenRoster,
}: FleetRailsProps) {
  const [sort, setSort] = useState<SortMode>("pico");

  const sorted = useMemo(() => {
    const copy = [...fleet];
    if (sort === "identificador") {
      return copy.sort((a, b) =>
        compareIdentifiers(a.busIdentifier, b.busIdentifier),
      );
    }
    if (sort === "media") {
      const mean = (load: BusLoad) =>
        load.days.reduce((sum, d) => sum + d.value, 0) / DAYS.length;
      return copy.sort((a, b) => mean(b) - mean(a));
    }
    return copy.sort(
      (a, b) =>
        b.peak - a.peak || compareIdentifiers(a.busIdentifier, b.busIdentifier),
    );
  }, [fleet, sort]);

  return (
    <section
      aria-labelledby="info-frota"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="info-frota" className="text-sm font-semibold text-on-surface">
          Frota
        </h2>
        <div className="flex items-center gap-1">
          <span className="text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
            Ordenar
          </span>
          {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSort(mode)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] transition-colors duration-150 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                sort === mode
                  ? "bg-surface-container-high font-semibold text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {SORT_LABEL[mode]}
            </button>
          ))}
        </div>
      </header>

      {/* Cabeçalho de dias alinhado aos segmentos. */}
      <div className="mb-1 flex items-center gap-3 px-2">
        <div className="w-44 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-0.5">
          {DAYS.map((day) => (
            <span
              key={day}
              className="flex-1 text-center text-[10px] uppercase tracking-[0.08em] text-on-surface-muted"
            >
              {DAY_LABELS[day].slice(0, 3)}
            </span>
          ))}
        </div>
        <div className="w-32 shrink-0" />
      </div>

      <div className="space-y-0.5">
        {sorted.map((load) => (
          <FleetRail
            key={load.busId || load.busIdentifier}
            load={load}
            metric={metric}
            palette={palette}
            lens={lens}
            universityNames={universityNames}
            capacityByBusDay={capacityByBusDay}
            onPatchLens={onPatchLens}
            onOpenRoster={() => onOpenRoster(load.busId, load.busIdentifier)}
          />
        ))}

        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-on-surface-muted">
            Nenhum ônibus com viagens neste recorte.
          </p>
        )}
      </div>

      <p className="mt-3 border-t border-outline-variant pt-2 text-[11px] text-on-surface-variant">
        {formatNumber(busesActive)} ônibus ativos ·{" "}
        {formatNumber(busesInactive)} inativos ·{" "}
        {formatNumber(studentsTransported)} alunos transportados no ciclo
        {dualEnrollment > 0 && (
          <>
            {" · "}
            {formatNumber(dualEnrollment)} com dupla matrícula
          </>
        )}
      </p>
    </section>
  );
}
