"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/types/cards.types";
import { DAYS, PERIODS, type Period } from "@/types/info.types";
import type { Bus } from "@/types/university.types";
import { loadBusRoster, type BusRosterEntry } from "@/services/infoService";
import { PERIOD_COLOR_VAR, busLabel } from "@/lib/info/palette";
import { isPeriod } from "@/lib/info/normalize";
import { formatNumber } from "@/lib/info/format";
import { downloadCsv } from "@/lib/csvUtils";

interface BusRosterDrawerProps {
  open: boolean;
  busId: string | null;
  busIdentifier: string | null;
  cycleId: string | null;
  bus: Bus | null;
  universityNames: Map<string, string>;
  onClose: () => void;
}

type SortMode = "nome" | "dias";

/** Drill-down nominal: quem está neste ônibus, dia a dia. */
export function BusRosterDrawer(props: BusRosterDrawerProps) {
  // A chave remonta o conteúdo quando o ônibus ou o ciclo muda, garantindo que
  // o roster nunca mostre o resultado do ônibus anterior enquanto carrega.
  return (
    <RosterContent
      key={`${props.busId ?? "none"}|${props.cycleId ?? "none"}`}
      {...props}
    />
  );
}

function RosterContent({
  open,
  busId,
  busIdentifier,
  cycleId,
  bus,
  universityNames,
  onClose,
}: BusRosterDrawerProps) {
  /**
   * Um estado só para a requisição: o repouso é "carregando", e o resultado
   * chega pelo callback assíncrono — sem sincronizar estado dentro do efeito.
   */
  const [request, setRequest] = useState<{
    status: "loading" | "ready" | "error";
    entries: BusRosterEntry[];
    message: string | null;
  }>({ status: "loading", entries: [], message: null });

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("nome");
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!open || !busId) return;

    const mountState = { cancelled: false };

    loadBusRoster(busId, cycleId)
      .then((data) => {
        if (mountState.cancelled) return;
        setRequest({ status: "ready", entries: data, message: null });
      })
      .catch((err: unknown) => {
        if (mountState.cancelled) return;
        setRequest({
          status: "error",
          entries: [],
          message:
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o roster.",
        });
      });

    return () => {
      mountState.cancelled = true;
    };
  }, [open, busId, cycleId, retryTick]);

  const roster = request.entries;
  const loading = request.status === "loading";
  const error = request.status === "error" ? request.message : null;

  const rows = useMemo(() => {
    const normalized = query
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("pt-BR")
      .trim();

    const filtered = normalized
      ? roster.filter((entry) =>
          `${entry.name ?? ""} ${entry.email ?? ""}`
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLocaleLowerCase("pt-BR")
            .includes(normalized),
        )
      : roster;

    const dayCount = (entry: BusRosterEntry) =>
      DAYS.filter((day) => entry.days?.[day]).length;

    return [...filtered].sort((a, b) =>
      sort === "dias"
        ? dayCount(b) - dayCount(a) ||
          (a.name ?? "").localeCompare(b.name ?? "", "pt-BR")
        : (a.name ?? "").localeCompare(b.name ?? "", "pt-BR"),
    );
  }, [roster, query, sort]);

  function handleDownload() {
    const escape = (v: unknown) =>
      `"${String(v ?? "").replace(/"/g, '""').replace(/[\r\n]+/g, " ")}"`;
    const header = ["Nome", "E-mail", ...DAYS.map((d) => DAY_LABELS[d])]
      .map(escape)
      .join(",");
    const body = rows.map((entry) =>
      [
        entry.name ?? "",
        entry.email ?? "",
        ...DAYS.map((day) => {
          const presence = entry.days?.[day];
          if (!presence) return "";
          return presence.status === "waitlisted"
            ? `${presence.period} (espera)`
            : presence.period;
        }),
      ]
        .map(escape)
        .join(","),
    );
    downloadCsv(
      [header, ...body].join("\n"),
      `roster-${(busIdentifier ?? "onibus").replace(/\s+/g, "-").toLocaleLowerCase("pt-BR")}.csv`,
    );
  }

  const slots = bus?.universitySlots ?? [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={busIdentifier ? busLabel(busIdentifier) : "Ônibus"}
    >
      <div className="space-y-3">
        {/* Cabeçalho: turno, capacidade e faculdades por ordem de prioridade. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-outline-variant pb-2 text-xs">
          <span className="text-on-surface-variant">
            Turno:{" "}
            <span className="font-medium text-on-surface">
              {bus?.shift ?? "-"}
            </span>
          </span>
          <span className="text-on-surface-variant">
            Capacidade:{" "}
            <span className="font-medium tabular-nums text-on-surface">
              {bus?.capacity == null
                ? "sem limite"
                : `${formatNumber(bus.capacity)} por faculdade/dia`}
            </span>
          </span>
          {slots.length > 0 && (
            <span className="text-on-surface-variant">
              Prioridade:{" "}
              <span className="font-medium text-on-surface">
                {[...slots]
                  .sort((a, b) => a.priorityOrder - b.priorityOrder)
                  .map((slot) => {
                    const id =
                      typeof slot.universityId === "string"
                        ? slot.universityId
                        : slot.universityId._id;
                    return (
                      universityNames.get(id) ??
                      (typeof slot.universityId === "object"
                        ? slot.universityId.acronym
                        : "-")
                    );
                  })
                  .join(" › ")}
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 min-w-48 flex-1 items-center gap-1.5 rounded-lg border border-outline-variant px-2">
            <Search className="size-3.5 shrink-0 text-on-surface-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou e-mail…"
              aria-label="Buscar aluno no roster"
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-muted"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
              Ordenar
            </span>
            {(["nome", "dias"] as SortMode[]).map((mode) => (
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
                {mode === "nome" ? "Nome" : "Nº de dias"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={rows.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 text-xs font-medium text-on-surface-variant transition-colors duration-150 cursor-pointer hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Download className="size-3.5" />
            Baixar roster
          </button>
        </div>

        {loading && (
          <p className="py-8 text-center text-sm text-on-surface-muted">
            Carregando roster…
          </p>
        )}

        {error && !loading && (
          <ErrorState
            message={error}
            onRetry={() => {
              setRequest({ status: "loading", entries: [], message: null });
              setRetryTick((t) => t + 1);
            }}
          />
        )}

        {!loading && !error && (
          <div className="max-h-96 overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-surface-container-lowest">
                <tr className="border-b border-outline-variant">
                  <th scope="col" className="py-1.5 text-left text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
                    Aluno
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      scope="col"
                      className="w-9 py-1.5 text-center text-[11px] uppercase tracking-[0.08em] text-on-surface-muted"
                    >
                      {DAY_LABELS[day].slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr
                    key={entry.studentId}
                    className="border-b border-outline-variant/50"
                  >
                    <td className="py-1.5 pr-2">
                      <span className="block truncate text-on-surface">
                        {entry.name ?? "Sem nome"}
                      </span>
                      <span className="block truncate text-[11px] text-on-surface-muted">
                        {entry.email ?? "-"}
                      </span>
                    </td>
                    {DAYS.map((day) => {
                      const presence = entry.days?.[day];
                      const period: Period | null =
                        presence && isPeriod(presence.period)
                          ? presence.period
                          : null;
                      const waitlisted = presence?.status === "waitlisted";
                      return (
                        <td key={day} className="py-1.5 text-center">
                          <span
                            title={
                              presence
                                ? `${DAY_LABELS[day]}: ${presence.period}${waitlisted ? " (lista de espera)" : ""}`
                                : `${DAY_LABELS[day]}: não viaja`
                            }
                            className={cn(
                              "mx-auto block size-4 rounded-sm",
                              !presence && "border border-outline-variant",
                              waitlisted && "info-hatch",
                            )}
                            style={
                              presence && period && !waitlisted
                                ? { backgroundColor: PERIOD_COLOR_VAR[period] }
                                : undefined
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length === 0 && (
              <p className="py-8 text-center text-sm text-on-surface-muted">
                {query
                  ? "Nenhum aluno encontrado."
                  : "Nenhum aluno alocado neste ônibus no ciclo."}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1 border-t border-outline-variant pt-2">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-on-surface-muted">
            {PERIODS.map((period) => (
              <span key={period} className="inline-flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: PERIOD_COLOR_VAR[period] }}
                />
                {period}
              </span>
            ))}
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="info-hatch size-2.5 rounded-sm" />
              Lista de espera
            </span>
          </p>
          {/* Ressalva obrigatória: esconder isso seria mentir para quem presta
              contas. O backend guarda uma entrada por dia no roster. */}
          <p className="text-[11px] text-on-surface-muted">
            O roster mostra um período por dia. Alunos que usam o mesmo ônibus em
            dois turnos no mesmo dia aparecem com o último registrado.
          </p>
        </div>
      </div>
    </Drawer>
  );
}
