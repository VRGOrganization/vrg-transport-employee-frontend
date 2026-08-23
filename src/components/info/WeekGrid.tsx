"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/types/cards.types";
import {
  DAYS,
  PERIODS,
  type Day,
  type Grid,
  type GridTotals,
  type InfoLens,
  type InfoMetric,
  type Period,
} from "@/types/info.types";
import type { BusPalette } from "@/lib/info/palette";
import { PERIOD_COLOR_VAR, busLabel } from "@/lib/info/palette";
import { formatNumber } from "@/lib/info/format";
import { WeekGridCell } from "./WeekGridCell";

interface WeekGridProps {
  grid: Grid;
  totals: GridTotals;
  lens: InfoLens;
  metric: InfoMetric;
  palette: BusPalette;
  /** Capacidade por (ônibus × dia), para o tooltip mostrar `x/y vagas`. */
  capacityByBusDay: Map<string, { filled: number; capacity: number | null }>;
  onPatchLens: (patch: Partial<InfoLens>) => void;
}

interface HoverState {
  day: Day;
  period: Period;
  x: number;
  y: number;
}

/**
 * A peça central: matriz 5 dias × 3 turnos.
 *
 * É onde a natureza dinâmica das vagas fica visível — um aluno ocupa assento só
 * nos dias e turnos em que tem aula, e a grade mostra essa granularidade em vez
 * de escondê-la atrás de uma média semanal.
 */
export function WeekGrid({
  grid,
  totals,
  lens,
  metric,
  palette,
  capacityByBusDay,
  onPatchLens,
}: WeekGridProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const cellKey = (day: Day, period: Period) => `${day}|${period}`;

  function focusCell(day: Day, period: Period) {
    cellRefs.current.get(cellKey(day, period))?.focus();
  }

  /** Setas navegam entre células; Esc limpa o recorte de dia/turno. */
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    day: Day,
    period: Period,
  ) {
    const dayIdx = DAYS.indexOf(day);
    const periodIdx = PERIODS.indexOf(period);

    const moves: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    };

    if (e.key in moves) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      const nextDay = DAYS[Math.min(DAYS.length - 1, Math.max(0, dayIdx + dx))];
      const nextPeriod =
        PERIODS[Math.min(PERIODS.length - 1, Math.max(0, periodIdx + dy))];
      focusCell(nextDay, nextPeriod);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      onPatchLens({ day: null, period: null });
    }
  }

  function toggleCell(day: Day, period: Period) {
    // Clicar de novo na célula selecionada desfaz o recorte.
    const isSelected = lens.day === day && lens.period === period;
    onPatchLens(
      isSelected ? { day: null, period: null } : { day, period },
    );
  }

  // Primeira célula focável: a selecionada, ou a primeira da grade (padrão de
  // roving tabindex — a grade inteira é uma única parada de tabulação).
  const focusableDay = lens.day ?? DAYS[0];
  const focusablePeriod = lens.period ?? PERIODS[0];

  const hoveredCell = hover ? grid[hover.day][hover.period] : null;

  return (
    <section
      aria-labelledby="info-semana"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 id="info-semana" className="text-sm font-semibold text-on-surface">
          Semana
        </h2>
        <p className="text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
          {metric === "pessoas" ? "Alunos" : "Pernas"} por dia e turno
        </p>
      </header>

      <div className="overflow-x-auto">
        <div
          role="grid"
          aria-label="Alunos por dia da semana e turno"
          className="min-w-160"
        >
          {/* Cabeçalho de dias, com o total da coluna clicável. */}
          <div role="row" className="mb-1.5 flex gap-1.5">
            <div role="columnheader" className="w-20 shrink-0" />
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                role="columnheader"
                onClick={() =>
                  onPatchLens({ day: lens.day === day ? null : day })
                }
                className={cn(
                  "flex flex-1 items-baseline justify-between gap-1 rounded px-1 py-0.5",
                  "transition-colors duration-150 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  lens.day === day
                    ? "text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {DAY_LABELS[day]}
                </span>
                <span className="text-xs tabular-nums text-on-surface-muted">
                  {formatNumber(totals.byDay[day])}
                </span>
              </button>
            ))}
          </div>

          {PERIODS.map((period) => (
            <div key={period} role="row" className="mb-1.5 flex gap-1.5">
              {/* Rótulo do turno, com o total da linha clicável. */}
              <button
                type="button"
                role="rowheader"
                onClick={() =>
                  onPatchLens({ period: lens.period === period ? null : period })
                }
                className={cn(
                  "flex w-20 shrink-0 flex-col items-start justify-center rounded px-1",
                  "transition-colors duration-150 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  lens.period === period
                    ? "text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: PERIOD_COLOR_VAR[period] }}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                    {period}
                  </span>
                </span>
                <span className="pl-3.5 text-xs tabular-nums text-on-surface-muted">
                  {formatNumber(totals.byPeriod[period])}
                </span>
              </button>

              {DAYS.map((day) => {
                const cell = grid[day][period];
                const isFocusable =
                  day === focusableDay && period === focusablePeriod;
                return (
                  <div
                    key={day}
                    className="flex-1"
                    onMouseEnter={(e) =>
                      cell.value > 0 &&
                      setHover({
                        day,
                        period,
                        x: e.currentTarget.getBoundingClientRect().left,
                        y: e.currentTarget.getBoundingClientRect().bottom,
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                  >
                    <WeekGridCell
                      ref={(node) => {
                        const key = cellKey(day, period);
                        if (node) cellRefs.current.set(key, node);
                        else cellRefs.current.delete(key);
                      }}
                      day={day}
                      period={period}
                      cell={cell}
                      max={totals.max}
                      metric={metric}
                      palette={palette}
                      selected={lens.day === day && lens.period === period}
                      tabIndex={isFocusable ? 0 : -1}
                      onSelect={() => toggleCell(day, period)}
                      onKeyDown={(e) => handleKeyDown(e, day, period)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip ancorado com a quebra por ônibus e as vagas do dia. */}
      {hover && hoveredCell && hoveredCell.byBus.length > 0 && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 w-56 rounded-lg border border-outline-variant bg-surface-container-lowest p-2 text-xs"
          style={{
            left: Math.min(hover.x, window.innerWidth - 240),
            top: hover.y + 6,
            boxShadow: "var(--shadow-modal)",
          }}
        >
          <p className="mb-1.5 font-semibold text-on-surface">
            {DAY_LABELS[hover.day]} · {hover.period}
          </p>
          <ul className="space-y-1">
            {hoveredCell.byBus.map((entry) => {
              const slot = capacityByBusDay.get(`${entry.busId}|${hover.day}`);
              return (
                <li
                  key={entry.busId || entry.busIdentifier}
                  className="flex items-center gap-1.5"
                >
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: palette.color(entry.busId || null) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-on-surface-variant">
                    {busLabel(entry.busIdentifier)}
                  </span>
                  <span className="shrink-0 tabular-nums text-on-surface">
                    {formatNumber(entry.value)}
                    {slot?.capacity != null && (
                      <span className="text-on-surface-muted">
                        {" "}
                        / {formatNumber(slot.capacity)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
