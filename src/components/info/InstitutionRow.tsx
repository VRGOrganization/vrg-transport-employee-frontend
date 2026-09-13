"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  UNKNOWN_COURSE_KEY,
  type InfoLens,
  type UniversityBreakdown,
} from "@/types/info.types";
import { PERIOD_COLOR_VAR } from "@/lib/info/palette";
import { formatNumber } from "@/lib/info/format";
import { Sparkline } from "./Sparkline";

interface InstitutionRowProps {
  row: UniversityBreakdown;
  expanded: boolean;
  selected: boolean;
  lens: InfoLens;
  onToggle: () => void;
  onPatchLens: (patch: Partial<InfoLens>) => void;
}

export function InstitutionRow({
  row,
  expanded,
  selected,
  lens,
  onToggle,
  onPatchLens,
}: InstitutionRowProps) {
  const shiftTotal = row.byShift.reduce((sum, s) => sum + s.students, 0);

  return (
    <li className="border-b border-outline-variant/60 last:border-b-0">
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 transition-colors duration-150",
          selected ? "bg-primary/8" : "hover:bg-surface-container-low",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Recolher" : "Expandir"} cursos de ${row.name}`}
          className="shrink-0 rounded p-0.5 text-on-surface-muted transition-colors duration-150 cursor-pointer hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-150",
              expanded && "rotate-90",
            )}
          />
        </button>

        <button
          type="button"
          onClick={() =>
            onPatchLens({
              universityId: selected ? null : row.universityId,
              courseKey: null,
            })
          }
          className="flex min-w-0 flex-1 items-center gap-2 rounded text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="w-14 shrink-0 truncate font-mono text-xs text-on-surface-variant">
            {row.acronym}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-on-surface">
            {row.name}
          </span>
          {row.temporary && (
            <span className="shrink-0 rounded border border-outline-variant px-1 text-[10px] uppercase tracking-wide text-on-surface-muted">
              temporária
            </span>
          )}
        </button>

        {/* Barra de 100% segmentada por turno — cores fixas de turno. */}
        <span
          className="hidden h-3 w-32 shrink-0 overflow-hidden rounded-sm bg-surface-container-low sm:flex"
          title={row.byShift
            .map((s) => `${s.period}: ${formatNumber(s.students)}`)
            .join(" · ")}
        >
          {row.byShift.map((slice) =>
            slice.students > 0 ? (
              <span
                key={slice.period}
                className="info-bar block h-full"
                style={{
                  width: `${(slice.students / shiftTotal) * 100}%`,
                  backgroundColor: PERIOD_COLOR_VAR[slice.period],
                }}
              />
            ) : null,
          )}
        </span>

        <span className="w-14 shrink-0 text-right text-sm tabular-nums text-on-surface">
          {formatNumber(row.students)}
        </span>
      </div>

      {expanded && (
        <ul className="pb-1.5 pl-8">
          {row.courses.map((course) => {
            const unknown = course.courseKey === UNKNOWN_COURSE_KEY;
            const courseSelected = lens.courseKey === course.courseKey;
            return (
              <li key={course.courseKey} className="flex items-center gap-2 py-1">
                <button
                  type="button"
                  onClick={() =>
                    onPatchLens({
                      universityId: row.universityId,
                      courseKey: courseSelected ? null : course.courseKey,
                    })
                  }
                  className={cn(
                    "flex min-w-0 flex-1 items-baseline gap-2 rounded text-left",
                    "transition-colors duration-150 cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    unknown ? "text-on-surface-muted" : "text-on-surface-variant",
                    courseSelected && "text-primary",
                  )}
                >
                  <span className="min-w-0 truncate text-[13px]">
                    {course.label}
                  </span>
                  {course.model && (
                    <span className="shrink-0 text-[11px] text-on-surface-muted">
                      {course.model}
                    </span>
                  )}
                </button>

                {unknown && (
                  <InfoTooltip
                    ariaLabel="Por que há cursos não identificados"
                    content="O curso do aluno é texto livre no cadastro e não casou com nenhum curso registrado nesta faculdade."
                  />
                )}

                <Sparkline values={course.weekly} />

                <span className="w-14 shrink-0 text-right text-[13px] tabular-nums">
                  {formatNumber(course.students)}
                </span>
              </li>
            );
          })}

          {row.courses.length === 0 && (
            <li className="py-1 text-[13px] text-on-surface-muted">
              Nenhum curso neste recorte.
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
