"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Custom skeleton cell rendered while loading. Defaults to a pulse bar. */
  skeleton?: ReactNode;
  render: (row: T, index: number, isMounted: boolean) => ReactNode;
}

export interface AdminTabItem {
  key: string;
  label: string;
  /** Material Symbols icon name */
  icon: string;
}

// ─── Internal constants ───────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminListTableProps<T> {
  /** Full list for the active tab — table handles filtering and pagination */
  rows: T[];
  rowKey: (row: T) => string;
  columns: TableColumn<T>[];

  loading: boolean;
  error?: string;
  onRetry?: () => void;

  tabs: AdminTabItem[];
  tab: string;
  onTabChange: (tab: string) => void;

  searchPlaceholder?: string;
  /** Return the searchable string fields for a given row */
  searchFields: (row: T) => string[];

  /** Custom empty state. Receives current tab key and whether a search is active */
  renderEmpty?: (tab: string, hasSearch: boolean) => ReactNode;

  /** Optional export button — only rendered when provided */
  onExport?: () => Promise<void>;
  exportLoading?: boolean;
  exportLabel?: string;

  /** Optional row click handler */
  onRowClick?: (row: T) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminListTable<T>({
  rows,
  rowKey,
  columns,
  loading,
  error,
  onRetry,
  tabs,
  tab,
  onTabChange,
  searchPlaceholder = "Buscar…",
  searchFields,
  renderEmpty,
  onExport,
  exportLoading = false,
  exportLabel = "Exportar CSV",
  onRowClick,
}: AdminListTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // Reset UI state whenever the active tab changes (new dataset)
  useEffect(() => {
    setSearch("");
    setPage(1);
  }, [tab]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      searchFields(row).some((f) => f.toLowerCase().includes(q))
    );
  }, [rows, search, searchFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handlePageSize = (s: PageSize) => { setPageSize(s); setPage(1); };

  return (
    <section className="flex flex-col flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl mx-4 mb-4 overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap border-b border-outline-variant/20">

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                tab === t.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface",
              ].join(" ")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Right group: search + export */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Search */}
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              style={{ fontSize: "16px" }}
            >
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-9 pr-8 rounded-lg ring-1 ring-outline/40 bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none transition-all w-80 cursor-text"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>close</span>
              </button>
            )}
          </div>

          {/* Export button — only when onExport is provided */}
          {onExport && (
            <button
              onClick={() => void onExport()}
              disabled={exportLoading}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs font-medium text-on-surface-variant hover:bg-surface-container-low hover:border-outline transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
            >
              {exportLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              <span>{exportLoading ? "Exportando..." : exportLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead className="sticky top-0">
            <tr className="bg-surface-container-low">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider",
                    col.align === "right" ? "text-right" : "",
                  ].join(" ").trim()}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/20">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      {col.skeleton ?? (
                        <div
                          className={[
                            "h-3 w-24 bg-surface-container-high rounded animate-pulse",
                            col.align === "right" ? "ml-auto" : "",
                          ].join(" ").trim()}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-error text-4xl">error</span>
                    <p className="text-on-surface-variant text-sm">{error}</p>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Tentar novamente
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  {renderEmpty ? renderEmpty(tab, Boolean(search.trim())) : (
                    <p className="text-on-surface-variant text-sm">Nenhum item encontrado.</p>
                  )}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={[
                    "hover:bg-surface-container-low/40 transition-colors",
                    onRowClick ? "cursor-pointer" : "",
                  ].join(" ").trim()}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        "px-4 py-3.5",
                        col.align === "right" ? "text-right" : "",
                      ].join(" ").trim()}
                    >
                      {col.render(row, idx, isMounted)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination footer ───────────────────────────────────────── */}
      <div className="px-4 py-3.5 border-t border-outline-variant/20 flex items-center justify-between text-sm text-on-surface-variant flex-shrink-0">

        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="text-xs">Linhas por página:</span>
          <div className="flex items-center gap-1">
            {PAGE_SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handlePageSize(s)}
                className={[
                  "w-9 h-7 rounded-md text-xs font-semibold transition-all",
                  pageSize === s
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-3">
          <span className="text-xs">
            {filtered.length === 0
              ? "0 de 0"
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} de ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={loading || page <= 1}
              suppressHydrationWarning
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Primeira página"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>first_page</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              suppressHydrationWarning
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span>
            </button>
            <span className="text-xs px-2">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading || page >= totalPages}
              suppressHydrationWarning
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={loading || page >= totalPages}
              suppressHydrationWarning
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Última página"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>last_page</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
