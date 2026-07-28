"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldBan, ShieldCheck } from "lucide-react";
import { banlistService } from "@/services/banlistService";
import { employeeService } from "@/services/employeeService";
import type { BanlistEntry } from "@/types/banlist";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { useListPage } from "@/hooks/ui/useListPage";
import { UnbanModal } from "@/components/admin/UnbanModal";
import type { PageSize } from "@/lib/constants";
import { resolveDisplayName, toTitleCase } from "@/lib/utils/string";

type Tab = "active" | "inactive";

const TAB_ITEMS = [
  { key: "active" as Tab,   label: "Banidos",    icon: "block"        },
  { key: "inactive" as Tab, label: "Desbanidos", icon: "check_circle" },
];

const COLUMNS: Column<BanlistEntry>[] = [
  {
    key: "name",
    label: "Estudante",
    render: (entry) => (
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-error/10 flex items-center justify-center text-error font-bold text-xs flex-shrink-0">
          {resolveDisplayName(entry).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface">{toTitleCase(resolveDisplayName(entry))}</p>
          {entry.socialName?.trim() && (
            <p className="text-xs text-on-surface-variant">Nome de registro: {toTitleCase(entry.name)}</p>
          )}
          <p className="text-xs text-on-surface-variant">{entry.email}</p>
        </div>
      </div>
    ),
    skeleton: () => (
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
        <div className="h-3 w-36 bg-surface-container-high rounded animate-pulse" />
      </div>
    ),
  },
  {
    key: "reasons",
    label: "Motivos",
    render: (entry) => (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {entry.reasons.slice(0, 2).map((r, i) => (
          <span
            key={i}
            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-error/8 text-error border border-error/20 truncate max-w-[160px]"
            title={r}
          >
            {r}
          </span>
        ))}
        {entry.reasons.length > 2 && (
          <span className="text-[10px] text-on-surface-variant">
            +{entry.reasons.length - 2} mais
          </span>
        )}
      </div>
    ),
  },
  {
    key: "createdAt",
    label: "Data do banimento",
    render: (entry) => (
      <span className="text-sm text-on-surface-variant">
        {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
      </span>
    ),
  },
  {
    key: "unbannedAt",
    label: "Data do desbanimento",
    render: (entry) => (
      <span className="text-sm text-on-surface-variant">
        {entry.unbannedAt ? new Date(entry.unbannedAt).toLocaleDateString("pt-BR") : "—"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (entry) => (
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          entry.active
            ? "bg-error/10 text-error border border-error/20"
            : "bg-success-container text-on-success"
        }`}
      >
        {entry.active ? "Banido" : "Desbanido"}
      </span>
    ),
  },
];

export function BanlistPage({ role }: { role: "admin" | "employee" }) {
  void role;
  const [unbanTarget, setUnbanTarget] = useState<BanlistEntry | null>(null);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});

  useEffect(() => {
    employeeService
      .list()
      .then((employees) => {
        const map: Record<string, string> = {};
        for (const emp of employees) map[emp._id] = emp.name;
        setAdminNames(map);
      })
      .catch(() => {});
  }, []);

  const fetcher = useCallback(
    (t: Tab) => banlistService.list(t === "active" ? true : false),
    [],
  );

  const { tab, setTab, search, setSearch, page, setPage, pageSize, setPageSize,
    loading, error, paginated, total, reload, reloadAll } =
    useListPage<BanlistEntry, Tab>({
      tabs: ["active", "inactive"],
      initialTab: "active",
      fetcher,
      searchFields: (e) => [e.name, e.socialName ?? "", e.email],
      errorMessage: "Não foi possível carregar a lista de banimentos.",
    });

  const adminColumn: Column<BanlistEntry> = {
    key: "responsibleAdmin",
    label: "Responsável",
    render: (entry) => {
      const id = entry.active ? entry.bannedByAdminId : (entry.unbannedByAdminId ?? entry.bannedByAdminId);
      const name = id ? adminNames[id] : undefined;
      return <span className="text-sm text-on-surface-variant">{name ?? "—"}</span>;
    },
  };

  const unbanReasonColumn: Column<BanlistEntry> = {
    key: "unbanReasons",
    label: "Motivo do desbanimento",
    render: (entry) => (
      <span className="text-sm text-on-surface-variant max-w-xs truncate block" title={entry.unbanReasons?.join("; ")}>
        {entry.unbanReasons && entry.unbanReasons.length > 0 ? entry.unbanReasons.join("; ") : "—"}
      </span>
    ),
  };

  const actionsColumn: Column<BanlistEntry> = {
    key: "actions",
    label: "Ação",
    align: "right",
    render: (entry) =>
      entry.active ? (
        <button
          onClick={(e) => { e.stopPropagation(); setUnbanTarget(entry); }}
          title="Remover banimento"
          className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-success hover:bg-success/10 transition-colors ml-auto"
        >
          <ShieldCheck className="size-4" />
        </button>
      ) : (
        <span className="text-xs text-on-surface-variant/50 italic mr-2">—</span>
      ),
  };

  const columns =
    tab === "active"
      ? [...COLUMNS, adminColumn, actionsColumn]
      : [...COLUMNS, adminColumn, unbanReasonColumn, actionsColumn];

  return (
    <main className="flex flex-col flex-1 bg-surface overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Banimentos</h1>
          {!loading && !error && (
            <p className="text-sm text-on-surface-variant mt-1">
              {total} {total === 1 ? "registro" : "registros"}{" "}
              {tab === "active" ? "de alunos banidos" : "de desbanimentos"}
            </p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 pb-3">
        <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={paginated}
        rowKey={(e) => e._id}
        loading={loading}
        error={error ? <ErrorState message={error} onRetry={reload} /> : undefined}
        empty={
          <EmptyState
            icon={tab === "active" ? ShieldBan : ShieldCheck}
            title={tab === "active" ? "Nenhum aluno banido" : "Nenhum desbanimento registrado"}
            description={
              search
                ? "Nenhum registro encontrado para esta busca."
                : tab === "active"
                ? "Nenhum aluno está banido no momento."
                : "Desbanimentos aparecerão aqui."
            }
          />
        }
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => setPageSize(s as PageSize)}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Buscar por nome ou e-mail…",
        }}
        className="mx-4 mb-4"
      />

      {unbanTarget && (
        <UnbanModal
          open
          entry={unbanTarget}
          onClose={() => setUnbanTarget(null)}
          onSuccess={() => { setUnbanTarget(null); reloadAll(); }}
        />
      )}
    </main>
  );
}
