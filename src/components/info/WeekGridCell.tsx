"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/types/cards.types";
import type { Day, GridCell, Period } from "@/types/info.types";
import type { BusPalette } from "@/lib/info/palette";
import { PERIOD_COLOR_VAR, busLabel } from "@/lib/info/palette";
import { formatNumber } from "@/lib/info/format";

interface WeekGridCellProps {
  day: Day;
  period: Period;
  cell: GridCell;
  /** Máximo da grade — a célula fala de demanda, não de capacidade. */
  max: number;
  selected: boolean;
  palette: BusPalette;
  tabIndex: number;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

export const WeekGridCell = forwardRef<HTMLButtonElement, WeekGridCellProps>(
  function WeekGridCell(
    {
      day,
      period,
      cell,
      max,
      selected,
      palette,
      tabIndex,
      onSelect,
      onKeyDown,
    },
    ref,
  ) {
    const empty = cell.value === 0;
    const fillPercent = max > 0 ? (cell.value / max) * 100 : 0;
    const busCount = cell.byBus.length;

    const unit = cell.value === 1 ? "aluno" : "alunos";
    const label = `${DAY_LABELS[day]}, ${period.toLocaleLowerCase("pt-BR")}: ${formatNumber(
      cell.value,
    )} ${unit} em ${busCount} ônibus`;

    return (
      <button
        ref={ref}
        type="button"
        role="gridcell"
        aria-label={label}
        aria-selected={selected}
        tabIndex={tabIndex}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        className={cn(
          "group relative h-23 w-full overflow-hidden rounded-lg text-left",
          "bg-surface-container-low cursor-pointer",
          "transition-[outline-color] duration-150",
          "outline-1 outline-transparent",
          "focus-visible:outline-primary focus-visible:outline-2",
          !empty && "hover:outline-primary",
          selected && "outline-2 outline-primary",
        )}
      >
        {/* Preenchimento de baixo para cima, proporcional ao máximo da grade. */}
        {!empty && (
          <span
            aria-hidden="true"
            className="info-fill absolute inset-x-0 bottom-0 block"
            style={{
              height: `${fillPercent}%`,
              backgroundColor: PERIOD_COLOR_VAR[period],
              opacity: 0.18,
            }}
          />
        )}

        {/* Zero real ≠ sem dado: a hachura diferencia. */}
        {empty && (
          <span
            aria-hidden="true"
            className="info-hatch absolute inset-0 block"
          />
        )}

        <span className="relative flex h-full flex-col justify-between p-2">
          <span
            className={cn(
              "text-2xl font-semibold leading-none tabular-nums",
              empty ? "text-on-surface-muted" : "text-on-surface",
            )}
          >
            {formatNumber(cell.value)}
          </span>
          {!empty && (
            <span className="text-[11px] text-on-surface-variant">
              {busCount} {busCount === 1 ? "ônibus" : "ônibus"}
            </span>
          )}
        </span>

        {/* Barra empilhada na base: revela QUAIS ônibus atendem a célula,
            sem exigir clique. */}
        {!empty && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 flex h-1.5"
          >
            {cell.byBus.map((entry) => (
              <span
                key={entry.busId || entry.busIdentifier}
                className="info-bar block h-full"
                style={{
                  width: `${(entry.value / cell.value) * 100}%`,
                  backgroundColor: palette.color(entry.busId || null),
                }}
                title={`${busLabel(entry.busIdentifier)}: ${formatNumber(entry.value)}`}
              />
            ))}
          </span>
        )}
      </button>
    );
  },
);
