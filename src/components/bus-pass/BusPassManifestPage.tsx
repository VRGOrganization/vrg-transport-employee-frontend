"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { PageSize } from "@/lib/constants";
import { busPassService } from "@/services/busPassService";
import type { BusPass } from "@/types/busPass";
import { formatCivilDate, todayInBR, weekdayLabel } from "@/types/busPass";

interface ManifestRow {
  key: string;
  busIdentifier: string;
  universityAcronym: string;
  leg: "Ida" | "Volta";
  period: string;
  studentName: string;
  studentRegistration: string | null;
  verificationCode: string | null;
}

/**
 * Manifesto: quem embarca em cada ônibus numa data. Um passe integral aparece
 * duas vezes — uma por perna — porque são embarques distintos, possivelmente
 * em ônibus diferentes.
 */
function toRows(passes: BusPass[]): ManifestRow[] {
  const rows: ManifestRow[] = [];

  for (const pass of passes) {
    const legs = [
      { leg: "Ida" as const, data: pass.outbound },
      { leg: "Volta" as const, data: pass.inbound },
    ];

    for (const { leg, data } of legs) {
      if (!data) continue;
      rows.push({
        key: `${pass.id}:${leg}`,
        busIdentifier: data.busIdentifier ?? "-",
        universityAcronym: data.universityAcronym ?? "-",
        leg,
        period: data.period ?? "-",
        studentName: pass.studentName,
        studentRegistration: pass.studentRegistration,
        verificationCode: pass.verificationCode,
      });
    }
  }

  return rows.sort(
    (a, b) =>
      a.busIdentifier.localeCompare(b.busIdentifier) ||
      a.leg.localeCompare(b.leg) ||
      a.studentName.localeCompare(b.studentName),
  );
}

export function BusPassManifestPage({ role }: { role: "admin" | "employee" }) {
  const backHref = `/${role}/bus-pass`;

  const [date, setDate] = useState(todayInBR());
  const [passes, setPasses] = useState<BusPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setPasses(await busPassService.manifest(date));
    } catch (err: unknown) {
      setPasses([]);
      setError(
        (err as { message?: string })?.message ??
          "Não foi possível carregar o manifesto.",
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [date]);

  const rows = useMemo(() => toRows(passes), [passes]);

  const columns = useMemo<Column<ManifestRow>[]>(
    () => [
      {
        key: "bus",
        label: "Ônibus",
        render: (row) => (
          <span className="font-medium text-on-surface">{row.busIdentifier}</span>
        ),
      },
      { key: "leg", label: "Sentido", render: (row) => row.leg },
      { key: "period", label: "Turno", render: (row) => row.period },
      {
        key: "destination",
        label: "Destino",
        render: (row) => row.universityAcronym,
      },
      {
        key: "student",
        label: "Aluno",
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate text-on-surface">{row.studentName || "-"}</p>
            {row.studentRegistration ? (
              <p className="truncate text-xs text-on-surface-variant">
                {row.studentRegistration}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "code",
        label: "Código",
        render: (row) => (
          <span className="font-mono text-xs text-on-surface-variant">
            {row.verificationCode ?? "-"}
          </span>
        ),
      },
    ],
    [],
  );

  const paginated = rows.slice((page - 1) * pageSize, page * pageSize);
  const weekday = passes[0] ? weekdayLabel(passes[0].travelDayOfWeek) : null;

  return (
    <main className="flex flex-1 flex-col bg-surface px-6 py-8 md:px-10">
      <div className="w-full space-y-6">
        <PageHeader
          back={backHref}
          title="Manifesto de passes"
          subtitle={`Passes aprovados para ${formatCivilDate(date)}${weekday ? ` · ${weekday}` : ""} · ${rows.length} embarque(s).`}
          rightSlot={
            <label className="flex items-center gap-2 text-sm text-on-surface-variant">
              Data
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-lg border border-outline bg-surface px-3 py-1.5 text-sm text-on-surface"
              />
            </label>
          }
          className="mb-0"
        />

        <DataTable
          columns={columns}
          rows={paginated}
          rowKey={(row) => row.key}
          loading={loading}
          error={error ?? undefined}
          empty="Nenhum passe aprovado para esta data."
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </main>
  );
}
