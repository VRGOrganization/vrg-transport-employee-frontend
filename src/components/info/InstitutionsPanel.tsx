"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERIODS, type InfoLens, type UniversityView } from "@/types/info.types";
import { PERIOD_COLOR_VAR } from "@/lib/info/palette";
import { formatNumber } from "@/lib/info/format";
import { InstitutionRow } from "./InstitutionRow";

type SortMode = "alunos" | "nome" | "cursos";

interface InstitutionsPanelProps {
  view: UniversityView;
  lens: InfoLens;
  onPatchLens: (patch: Partial<InfoLens>) => void;
}

const SORT_LABEL: Record<SortMode, string> = {
  alunos: "Alunos",
  nome: "Nome",
  cursos: "Cursos",
};

export function InstitutionsPanel({
  view,
  lens,
  onPatchLens,
}: InstitutionsPanelProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("alunos");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    const normalized = query
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("pt-BR")
      .trim();

    const matches = (value: string) =>
      value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized);

    // A busca filtra faculdades E cursos ao mesmo tempo: digitar o nome de um
    // curso traz a faculdade dele.
    const filtered = normalized
      ? view.rows.filter(
          (row) =>
            matches(row.name) ||
            matches(row.acronym) ||
            row.courses.some((course) => matches(course.label)),
        )
      : view.rows;

    return [...filtered].sort((a, b) => {
      if (sort === "nome") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "cursos") return b.courses.length - a.courses.length;
      return b.students - a.students;
    });
  }, [view.rows, query, sort]);

  function toggle(universityId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(universityId)) next.delete(universityId);
      else next.add(universityId);
      return next;
    });
  }

  return (
    <section
      aria-labelledby="info-instituicoes"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="info-instituicoes"
          className="text-sm font-semibold text-on-surface"
        >
          Instituições
        </h2>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-44 items-center gap-1.5 rounded-lg border border-outline-variant px-2">
            <Search className="size-3.5 shrink-0 text-on-surface-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Faculdade ou curso…"
              aria-label="Buscar faculdade ou curso"
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-muted"
            />
          </div>

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
        </div>
      </header>

      <ul>
        {rows.map((row) => (
          <InstitutionRow
            key={row.universityId}
            row={row}
            expanded={expanded.has(row.universityId)}
            selected={lens.universityId === row.universityId}
            lens={lens}
            onToggle={() => toggle(row.universityId)}
            onPatchLens={onPatchLens}
          />
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="py-6 text-center text-sm text-on-surface-muted">
          {query
            ? "Nenhuma faculdade ou curso encontrado."
            : "Nenhuma faculdade neste recorte."}
        </p>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-outline-variant pt-2 text-[11px] text-on-surface-muted">
        <span className="flex items-center gap-2">
          {PERIODS.map((period) => (
            <span key={period} className="inline-flex items-center gap-1">
              <span
                aria-hidden="true"
                className="size-2 rounded-sm"
                style={{ backgroundColor: PERIOD_COLOR_VAR[period] }}
              />
              {period}
            </span>
          ))}
        </span>
        {view.alunosComDuplaMatricula > 0 && (
          // Sem esta nota, a soma das faculdades não bate com o total e o
          // admin conclui que a página está errada.
          <span>
            {formatNumber(view.alunosComDuplaMatricula)}{" "}
            {view.alunosComDuplaMatricula === 1
              ? "aluno conta em duas faculdades"
              : "alunos contam em duas faculdades"}{" "}
            (dupla matrícula), então a soma passa do total.
          </span>
        )}
      </footer>
    </section>
  );
}
