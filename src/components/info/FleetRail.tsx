"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/types/cards.types";
import type { BusLoad, Day, InfoLens } from "@/types/info.types";
import type { BusPalette } from "@/lib/info/palette";
import { busLabel } from "@/lib/info/palette";
import { formatNumber } from "@/lib/info/format";

interface FleetRailProps {
  load: BusLoad;
  palette: BusPalette;
  lens: InfoLens;
  universityNames: Map<string, string>;
  /** Vagas por (ônibus × dia); só no ciclo ativo. */
  capacityByBusDay: Map<string, { filled: number; capacity: number | null }>;
  onPatchLens: (patch: Partial<InfoLens>) => void;
  onOpenRoster: () => void;
}

/**
 * Um ônibus por linha, com os cinco dias lado a lado.
 *
 * Ver o vazio é metade do valor deste painel: é onde há ônibus ocioso. Por
 * isso o dia sem viagem aparece hachurado em vez de simplesmente ausente.
 */
export function FleetRail({
  load,
  palette,
  lens,
  universityNames,
  capacityByBusDay,
  onPatchLens,
  onOpenRoster,
}: FleetRailProps) {
  const [hoveredDay, setHoveredDay] = useState<Day | null>(null);
  const color = palette.color(load.busId || null);
  const isSelected = lens.busId === load.busId;

  const hovered = hoveredDay
    ? load.days.find((d) => d.day === hoveredDay)
    : null;
  const hoveredSlot = hoveredDay
    ? capacityByBusDay.get(`${load.busId}|${hoveredDay}`)
    : null;

  return (
    <div
      className={cn(
        "relative flex h-11 items-center gap-3 rounded-lg px-2",
        "transition-colors duration-150",
        isSelected ? "bg-primary/8" : "hover:bg-surface-container-low",
      )}
    >
      {/* Identificação: cor da rampa + identificador + turno do ônibus. */}
      <button
        type="button"
        onClick={onOpenRoster}
        className="flex w-44 shrink-0 items-center gap-2 rounded text-left transition-colors duration-150 cursor-pointer hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-on-surface">
            {busLabel(load.busIdentifier)}
          </span>
          <span className="block text-[11px] text-on-surface-muted">
            {load.shift ?? "Sem turno"}
            {load.capacity == null && " · sem limite"}
          </span>
        </span>
      </button>

      {/* Cinco segmentos de largura igual: a semana inteira sempre visível. */}
      <div className="flex min-w-0 flex-1 gap-0.5">
        {load.days.map((day) => {
          const empty = day.value === 0;
          // Normaliza pelo pico DO PRÓPRIO ônibus: o trilho fala da variação
          // interna do veículo, não da comparação entre veículos.
          const fill = load.peak > 0 ? (day.value / load.peak) * 100 : 0;
          const slot = capacityByBusDay.get(`${load.busId}|${day.day}`);
          const capacityMark =
            slot?.capacity != null && load.peak > 0 && slot.capacity <= load.peak
              ? (slot.capacity / load.peak) * 100
              : null;

          return (
            <button
              key={day.day}
              type="button"
              aria-label={`${busLabel(load.busIdentifier)}, ${DAY_LABELS[day.day]}: ${formatNumber(day.value)} ${day.value === 1 ? "aluno" : "alunos"}`}
              onMouseEnter={() => setHoveredDay(day.day)}
              onMouseLeave={() => setHoveredDay(null)}
              onFocus={() => setHoveredDay(day.day)}
              onBlur={() => setHoveredDay(null)}
              onClick={() =>
                onPatchLens({
                  busId: isSelected && lens.day === day.day ? null : load.busId,
                  day: lens.day === day.day && isSelected ? null : day.day,
                })
              }
              className={cn(
                "relative h-7 flex-1 overflow-hidden rounded-sm bg-surface-container-low",
                "transition-[outline-color] duration-150 cursor-pointer",
                "outline-1 outline-transparent hover:outline-primary",
                "focus-visible:outline-primary focus-visible:outline-2",
                lens.day === day.day && isSelected && "outline-2 outline-primary",
              )}
            >
              {empty ? (
                <span aria-hidden="true" className="info-hatch absolute inset-0 block" />
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    className="info-bar absolute inset-y-0 left-0 block"
                    style={{ width: `${fill}%`, backgroundColor: color }}
                  />
                  {/* Subdivisões por faculdade dentro do preenchimento. */}
                  {day.byUniversity.length > 1 && (
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 flex" style={{ width: `${fill}%` }}>
                      {day.byUniversity.slice(0, -1).map((uni, i) => (
                        <span
                          key={uni.universityId || i}
                          className="block h-full border-r border-surface-container-lowest"
                          style={{ width: `${(uni.value / day.value) * 100}%` }}
                        />
                      ))}
                    </span>
                  )}
                  {/* Marca de capacidade: leitura instantânea de folga. */}
                  {capacityMark !== null && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 block w-0.5 bg-outline"
                      style={{ left: `${capacityMark}%` }}
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="w-32 shrink-0 text-right">
        <span className="block text-sm tabular-nums text-on-surface">
          {formatNumber(load.students)}
        </span>
        <span className="block text-[11px] tabular-nums text-on-surface-muted">
          pico {formatNumber(load.peak)}
        </span>
      </div>

      {/* Tooltip do dia: faculdades e vagas do vínculo. */}
      {hovered && hovered.value > 0 && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-48 top-full z-[var(--z-dropdown)] mt-1 w-56 rounded-lg border border-outline-variant bg-surface-container-lowest p-2 text-xs"
          style={{ boxShadow: "var(--shadow-modal)" }}
        >
          <p className="mb-1 font-semibold text-on-surface">
            {DAY_LABELS[hovered.day]}
          </p>
          <ul className="space-y-0.5">
            {hovered.byUniversity.map((uni) => (
              <li key={uni.universityId} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-on-surface-variant">
                  {universityNames.get(uni.universityId) ?? "Não identificada"}
                </span>
                <span className="shrink-0 tabular-nums text-on-surface">
                  {formatNumber(uni.value)}
                </span>
              </li>
            ))}
          </ul>
          {hoveredSlot && (
            <p className="mt-1 border-t border-outline-variant pt-1 text-on-surface-muted">
              {hoveredSlot.capacity == null
                ? "Sem limite de vagas"
                : `Contador do ônibus: ${formatNumber(hoveredSlot.filled)} · ${formatNumber(hoveredSlot.capacity)} por faculdade`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
