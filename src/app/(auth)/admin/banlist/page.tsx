"use client";

import { useState, useEffect, useCallback } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { employeeApi } from "@/lib/employeeApi";
import type { BanlistEntry } from "@/types/banlist";
import { AdminListTable, type TableColumn, type AdminTabItem } from "@/components/admin/AdminListTable";
import { UnbanModal } from "@/components/admin/UnbanModal";
import { Pencil } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "active" | "inactive";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: AdminTabItem[] = [
  { key: "active",   label: "Banidos",     icon: "block"         },
  { key: "inactive", label: "Desbanidos",  icon: "check_circle"  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BanlistPage() {
  const { user, logout } = useEmployeeAuth();

  const [tab, setTab]           = useState<Tab>("active");
  const [entries, setEntries]   = useState<BanlistEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [unbanTarget, setUnbanTarget] = useState<BanlistEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const all = await employeeApi.get<BanlistEntry[] | { data?: BanlistEntry[] }>("/banlist");
      setEntries(Array.isArray(all) ? all : (all?.data ?? []));
    } catch {
      setError("Não foi possível carregar a lista de banimentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTabChange = (t: string) => { setTab(t as Tab); };

  const source = tab === "active"
    ? entries.filter((e) => e.active)
    : entries.filter((e) => !e.active);

  /* ── Columns ──────────────────────────────────────────────────────── */

  const columns: TableColumn<BanlistEntry>[] = [
    {
      key: "name",
      header: "Estudante",
      skeleton: (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
          <div className="h-3 w-36 bg-surface-container-high rounded animate-pulse" />
        </div>
      ),
      render: (entry) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center text-error font-bold text-xs flex-shrink-0">
            {entry.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface">{entry.name}</p>
            <p className="text-xs text-on-surface-variant">{entry.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "reasons",
      header: "Motivos",
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
      header: "Data do banimento",
      render: (entry, _i, isMounted) => (
        <span className="text-sm text-on-surface-variant">
          {isMounted
            ? new Date(entry.createdAt).toLocaleDateString("pt-BR")
            : "—"}
        </span>
      ),
    },
    {
      key: "unbannedAt",
      header: "Data do desbanimento",
      render: (entry, _i, isMounted) => (
        <span className="text-sm text-on-surface-variant">
          {entry.unbannedAt && isMounted
            ? new Date(entry.unbannedAt).toLocaleDateString("pt-BR")
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (entry) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          entry.active
            ? "bg-error/10 text-error border border-error/20"
            : "bg-success-container text-on-success"
        }`}>
          {entry.active ? "Banido" : "Desbanido"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ação",
      align: "right",
      render: (entry) => (
        entry.active ? (
          <button
            onClick={(e) => { e.stopPropagation(); setUnbanTarget(entry); }}
            title="Remover banimento"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-success hover:bg-success/10 transition-colors ml-auto"
          >
            <Pencil className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-xs text-on-surface-variant/50 italic mr-2">—</span>
        )
      ),
    },
  ];

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <div className="flex min-h-screen bg-surface">
      <SideNav activePath="/admin/banlist" onLogout={logout} />

      <div className="w-full flex flex-col min-h-screen">
        <TopBar user={user} />

        <main className="flex flex-col flex-1 bg-surface overflow-hidden">

          {/* Page header */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Banimentos</h1>
              {!loading && !error && (
                <p className="text-sm text-on-surface-variant mt-1">
                  {source.length}{" "}
                  {source.length === 1 ? "registro" : "registros"}{" "}
                  {tab === "active" ? "de alunos banidos" : "de desbanimentos"}
                </p>
              )}
            </div>
          </div>

          {/* Table */}
          <AdminListTable
            rows={source}
            rowKey={(e) => e._id}
            columns={columns}
            loading={loading}
            error={error}
            onRetry={load}
            tabs={TABS}
            tab={tab}
            onTabChange={handleTabChange}
            searchPlaceholder="Buscar por nome ou e-mail…"
            searchFields={(e) => [e.name, e.email]}
            renderEmpty={(t, hasSearch) => (
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                  {t === "active" ? "block" : "check_circle"}
                </span>
                <p className="text-on-surface-variant text-sm">
                  {hasSearch
                    ? "Nenhum registro encontrado para esta busca."
                    : t === "active"
                    ? "Nenhum aluno banido no momento."
                    : "Nenhum desbanimento registrado."}
                </p>
              </div>
            )}
          />
        </main>
      </div>

      {/* Unban Modal */}
      {unbanTarget && (
        <UnbanModal
          open
          entry={unbanTarget}
          onClose={() => setUnbanTarget(null)}
          onSuccess={() => { setUnbanTarget(null); load(); }}
        />
      )}
    </div>
  );
}
