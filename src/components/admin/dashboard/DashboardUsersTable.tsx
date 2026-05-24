"use client";

import { Download, Loader2 } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { getInitials, AVATAR_COLORS } from "@/lib/utils/string";
import type { PageSize } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRow = {
  id: string;
  name: string;
  identifier: string;
  type: "Aluno" | "Funcionário";
  status: "Ativo" | "Pendente" | "Inativo";
  createdAt: string;
};

export type UserFilter = "Todos" | "Aluno" | "Funcionário";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<UserRow["type"], string> = {
  Aluno: "bg-primary-fixed text-primary",
  Funcionário: "bg-secondary-fixed text-secondary",
};

const STATUS_STYLE: Record<UserRow["status"], string> = {
  Ativo: "bg-success-container text-on-success",
  Pendente: "bg-warning-container text-on-warning",
  Inativo: "bg-surface-container-high text-on-surface-variant",
};

const COLUMNS: Column<UserRow>[] = [
  {
    key: "name",
    label: "Usuário",
    render: (row, idx) => (
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
        >
          {getInitials(row.name)}
        </div>
        <span className="text-sm font-medium text-on-surface">{row.name}</span>
      </div>
    ),
    skeleton: () => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-container-high animate-pulse shrink-0" />
        <div className="h-3 w-32 bg-surface-container-high rounded animate-pulse" />
      </div>
    ),
  },
  {
    key: "identifier",
    label: "Identificador",
    render: (row) => (
      <span className="text-sm text-on-surface-variant">{row.identifier}</span>
    ),
  },
  {
    key: "type",
    label: "Tipo",
    render: (row) => (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_STYLE[row.type]}`}>
        {row.type}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[row.status]}`}>
        {row.status}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Cadastro",
    align: "right",
    render: (row) => (
      <span className="text-xs text-on-surface-variant">
        {new Date(row.createdAt).toLocaleDateString("pt-BR")}
      </span>
    ),
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardUsersTableProps {
  /** Paginated subset shown in the table */
  rows: UserRow[];
  /** Count after filter + search (drives pagination) */
  totalFiltered: number;
  /** Count before any filter (shown in the subtitle) */
  totalAll: number;
  loading: boolean;
  filter: UserFilter;
  onFilterChange: (f: UserFilter) => void;
  search: string;
  onSearch: (v: string) => void;
  page: number;
  pageSize: PageSize;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: PageSize) => void;
  exportLoading: boolean;
  onExport: () => void;
  exportLabel: string;
  exportTooltip: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardUsersTable({
  rows,
  totalFiltered,
  totalAll,
  loading,
  filter,
  onFilterChange,
  search,
  onSearch,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  exportLoading,
  onExport,
  exportLabel,
  exportTooltip,
}: DashboardUsersTableProps) {
  const sectionHeader = (
    <div className="px-6 py-3.5 border-b border-outline-variant/30 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 className="font-bold text-on-surface text-sm">Usuários do sistema</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          {totalFiltered} de {totalAll} registros · funcionários e alunos
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="Buscar por nome ou identificador…"
        />

        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg border border-outline-variant/30">
          {(["Todos", "Aluno", "Funcionário"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={[
                "px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer border-2",
                filter === f
                  ? "bg-primary text-on-primary shadow-sm border-primary"
                  : "text-on-surface-variant hover:text-on-surface border-transparent hover:border-outline-variant/40",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={onExport}
          disabled={exportLoading}
          title={exportTooltip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {exportLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exportLoading ? "Exportando..." : exportLabel}
        </button>
      </div>
    </div>
  );

  return (
    <DataTable
      header={sectionHeader}
      columns={COLUMNS}
      rows={rows}
      rowKey={(r) => r.id}
      loading={loading}
      empty={
        <p className="text-center text-on-surface-variant text-sm">
          Nenhum usuário encontrado.
        </p>
      }
      page={page}
      pageSize={pageSize}
      total={totalFiltered}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      skeletonRowCount={6}
    />
  );
}
