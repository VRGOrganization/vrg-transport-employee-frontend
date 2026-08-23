"use client";

import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/types/cards.types";
import { DAYS, type Day } from "@/types/info.types";
import { formatNumber } from "@/lib/info/format";

interface DayOverlapMatrixProps {
  matrix: Record<Day, Record<Day, number>>;
}

/** Sigla curta para caber na matriz 5×5. */
const SHORT: Record<Day, string> = {
  SEG: "S",
  TER: "T",
  QUA: "Q",
  QUI: "Q",
  SEX: "S",
};

/**
 * Matriz 5×5 de sobreposição entre dias: quantos alunos aparecem em AMBOS os
 * dias do par. Responde "se eu cortar quinta, quantos desses alunos eu já
 * atendo em outro dia?".
 */
export function DayOverlapMatrix({ matrix }: DayOverlapMatrixProps) {
  // Escala monocromática sobre o maior valor FORA da diagonal: a diagonal é o
  // total do dia e dominaria a escala, achatando as sobreposições.
  let maxOffDiagonal = 0;
  for (const a of DAYS) {
    for (const b of DAYS) {
      if (a !== b) maxOffDiagonal = Math.max(maxOffDiagonal, matrix[a][b]);
    }
  }
  const scale = Math.max(maxOffDiagonal, 1);

  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-muted">
        Sobreposição entre dias
      </h3>

      <table className="w-full border-collapse">
        <caption className="sr-only">
          Alunos que viajam em ambos os dias de cada par. A diagonal traz o
          total de cada dia.
        </caption>
        <thead>
          <tr>
            <th className="w-8" />
            {DAYS.map((day) => (
              <th
                key={day}
                scope="col"
                className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-on-surface-muted"
              >
                <abbr title={DAY_LABELS[day]} className="no-underline">
                  {SHORT[day]}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((rowDay) => (
            <tr key={rowDay}>
              <th
                scope="row"
                className="pr-1 text-right text-[10px] font-semibold uppercase tracking-wide text-on-surface-muted"
              >
                <abbr title={DAY_LABELS[rowDay]} className="no-underline">
                  {SHORT[rowDay]}
                </abbr>
              </th>
              {DAYS.map((colDay) => {
                const value = matrix[rowDay][colDay];
                const isDiagonal = rowDay === colDay;
                return (
                  <td key={colDay} className="p-px">
                    <div
                      title={
                        isDiagonal
                          ? `${DAY_LABELS[rowDay]}: ${formatNumber(value)} alunos`
                          : `${DAY_LABELS[rowDay]} e ${DAY_LABELS[colDay]}: ${formatNumber(value)} alunos em ambos`
                      }
                      className={cn(
                        "flex h-7 items-center justify-center rounded-sm text-[11px] tabular-nums",
                        isDiagonal
                          ? "bg-surface-container-high font-semibold text-on-surface"
                          : "text-on-surface",
                      )}
                      style={
                        isDiagonal
                          ? undefined
                          : {
                              backgroundColor: `color-mix(in srgb, var(--color-primary) ${
                                (value / scale) * 70
                              }%, transparent)`,
                            }
                      }
                    >
                      {value > 0 ? formatNumber(value) : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 text-[11px] leading-snug text-on-surface-muted">
        Cada célula conta alunos que viajam nos dois dias. A diagonal, com fundo
        próprio, é o total do dia.
      </p>
    </div>
  );
}
