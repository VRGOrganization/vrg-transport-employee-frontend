"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS, type PageSize } from "@/lib/constants";
import { SearchInput } from "./SearchInput";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
  render: (row: T, index: number) => ReactNode;
  skeleton?: () => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: ReactNode;
  empty?: ReactNode;
  page: number;
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  onRowClick?: (row: T) => void;
  skeletonRowCount?: number;
  className?: string;

  /** Arbitrary content rendered at the very top of the section, before the toolbar */
  header?: ReactNode;

  /** Search field rendered inside the table toolbar */
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };

  /** Export button rendered inside the table toolbar */
  onExport?: () => void | Promise<void>;
  exportLoading?: boolean;
  exportLabel?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  empty,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  skeletonRowCount = 6,
  className,
  header,
  search,
  onExport,
  exportLoading = false,
  exportLabel = "Exportar CSV",
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasToolbar = search !== undefined || onExport !== undefined;

  return (
    <section
      className={cn(
        "flex flex-col flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden",
        className,
      )}
    >
      {/* ── Custom section header (injected by consumer) ─────────── */}
      {header}

      {/* ── Toolbar (search + export) ─────────────────────────────── */}
      {hasToolbar && (
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-end gap-2 flex-wrap">
          {search !== undefined && (
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
            />
          )}
          {onExport !== undefined && (
            <button
              onClick={() => void onExport()}
              disabled={exportLoading}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs font-medium text-on-surface-variant hover:bg-surface-container-low hover:border-outline transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
            >
              {exportLoading
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Download className="size-3.5" />}
              <span>{exportLoading ? "Exportando..." : exportLabel}</span>
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead className="sticky top-0">
            <tr className="bg-surface-container-low">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={cn(
                    "px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {loading ? (
              Array.from({ length: skeletonRowCount }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5">
                      {c.skeleton ? (
                        c.skeleton()
                      ) : (
                        <div className="h-3 w-24 bg-surface-container-high rounded animate-pulse" />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "hover:bg-surface-container-low/40 transition-colors",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3.5",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                      )}
                    >
                      {c.render(row, idx)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && rows.length > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </section>
  );
}

interface PaginationProps {
  page: number;
  pageSize: PageSize;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="px-4 py-3 border-t border-outline-variant/20 flex items-center justify-between gap-4 flex-wrap text-xs text-on-surface-variant">
      <div className="flex items-center gap-2">
        <span>Linhas por página:</span>
        <div className="flex items-center gap-1">
          {PAGE_SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onPageSizeChange(s)}
              suppressHydrationWarning
              className={cn(
                "w-9 h-7 rounded-md text-xs font-semibold transition-all",
                pageSize === s
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span>
          {start}–{end} de {total}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="size-7 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Primeira página"
        >
          <span className="material-symbols-outlined text-base">first_page</span>
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="size-7 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
          if (p < 1 || p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "size-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                p === page
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant hover:bg-surface-container-low",
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="size-7 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="size-7 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Última página"
        >
          <span className="material-symbols-outlined text-base">last_page</span>
        </button>
      </div>
    </div>
  );
}
