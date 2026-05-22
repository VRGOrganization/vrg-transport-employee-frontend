"use client";

import { useState } from "react";
import { Search, X, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export type FilterType = "Todos" | "Aluno" | "Funcionário";

export interface UserRow {
  id: string;
  name: string;
  identifier: string;
  type: "Aluno" | "Funcionário";
  status: "Ativo" | "Pendente" | "Inativo";
  createdAt: string;
}

interface DashboardUsersTableProps {
  rows: UserRow[];
  loading: boolean;
  exportLoading: boolean;
  onExport: (filter: FilterType) => Promise<void>;
}

const avatarColors = [
  "bg-primary-fixed text-primary",
  "bg-secondary-fixed text-secondary",
  "bg-tertiary-container text-tertiary",
  "bg-info-container text-on-info",
  "bg-success-container text-on-success",
  "bg-warning-container text-on-warning",
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TYPE_STYLE: Record<string, string> = {
  Aluno: "bg-primary-fixed text-primary",
  Funcionário: "bg-secondary-fixed text-secondary",
};

const STATUS_STYLE: Record<string, string> = {
  Ativo: "bg-success-container text-on-success",
  Pendente: "bg-warning-container text-on-warning",
  Inativo: "bg-surface-container-high text-on-surface-variant",
};

const PAGE_SIZE = 8;
const FILTERS = ["Todos", "Aluno", "Funcionário"] as const;

export function DashboardUsersTable({ rows, loading, exportLoading, onExport }: DashboardUsersTableProps) {
  const [filter, setFilter] = useState<FilterType>("Todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = rows
    .filter((r) => filter === "Todos" || r.type === filter)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.identifier.toLowerCase().includes(q);
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const exportLabel =
    filter === "Aluno"
      ? "Exportar Alunos"
      : filter === "Funcionário"
      ? "Exportar Funcionários"
      : "Exportar CSV";

  const exportTooltip =
    filter === "Aluno"
      ? "Exportar planilha com todos os alunos (Nome, Email, Telefone, Instituição, Turno, Status)"
      : filter === "Funcionário"
      ? "Exportar planilha com todos os funcionários (Nome, Email, Matrícula, Status)"
      : "Exportar relatório completo: Alunos, Funcionários, Frota e Instituições em um arquivo CSV";

  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-3.5 border-b border-outline-variant/30 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-on-surface text-sm">Usuários do sistema</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {filtered.length} de {rows.length} registros · funcionários e alunos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nome ou identificador…"
              className="h-8 pl-8 pr-8 rounded-lg border-none ring-1 ring-outline/40 bg-surface-container-lowest text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none transition-all w-64 cursor-text"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg border border-outline-variant/30">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={[
                  "px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer",
                  filter === f
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border border-transparent hover:border-outline-variant/40",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button
            onClick={() => void onExport(filter)}
            disabled={exportLoading}
            title={exportTooltip}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs font-medium text-on-surface-variant hover:bg-surface-container-low hover:border-outline-variant transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
          >
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{exportLoading ? "Exportando..." : exportLabel}</span>
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Identificador</th>
              <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[32, 40, 20, 16, 20].map((w, j) => (
                      <td key={j} className="px-6 py-3">
                        <div className={`h-3 w-${w} bg-surface-container-high rounded animate-pulse ${j === 4 ? "ml-auto" : ""}`} />
                      </td>
                    ))}
                  </tr>
                ))
              : paginated.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )
              : paginated.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                          {getInitials(row.name)}
                        </div>
                        <span className="text-sm font-medium text-on-surface">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-on-surface-variant">{row.identifier}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_STYLE[row.type]}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-on-surface-variant text-right">
                      {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
        <span>Exibindo {paginated.length} de {filtered.length} usuários</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                page === i + 1
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant hover:bg-surface-container-low"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
