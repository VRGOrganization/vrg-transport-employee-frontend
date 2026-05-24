"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { priorityRuleService } from "@/services/priorityRuleService";
import type { PriorityRule } from "@/types/priorityRule";
import { PriorityRuleModal } from "@/components/admin/PriorityRuleModal";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { SearchInput } from "@/components/ui/SearchInput";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { PageSize } from "@/lib/constants";

type Tab = "active" | "inactive";

const TAB_ITEMS = [
  { key: "active" as Tab, label: "Ativas", icon: "check_circle" },
  { key: "inactive" as Tab, label: "Inativas", icon: "cancel" },
];

export default function PriorityRulesPage() {
  const [rules, setRules] = useState<PriorityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PriorityRule | null>(null);
  const [toggleTarget, setToggleTarget] = useState<PriorityRule | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState("");

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await priorityRuleService.list();
      data.sort((a, b) => a.sortOrder - b.sortOrder || a.level - b.level);
      setRules(data);
    } catch {
      setError("Não foi possível carregar as regras de prioridade.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true);
    setToggleError("");
    try {
      const updated = await priorityRuleService.toggle(toggleTarget._id);
      setRules((prev) => prev.map((r) => (r._id === toggleTarget._id ? updated : r)));
      setToggleTarget(null);
    } catch {
      setToggleError("Não foi possível alterar o status da regra. Tente novamente.");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleSaved = (saved: PriorityRule) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setModalOpen(false);
    setEditing(null);
  };

  const handleDeleted = (id: string) => {
    setRules((prev) => prev.filter((r) => r._id !== id));
    setModalOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (rule: PriorityRule) => {
    setEditing(rule);
    setModalOpen(true);
  };

  const tabFiltered = tab === "active" ? rules.filter((r) => r.active) : rules.filter((r) => !r.active);

  const searchFiltered = search.trim()
    ? tabFiltered.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase()) ||
          String(r.level).includes(search),
      )
    : tabFiltered;

  const totalPages = Math.max(1, Math.ceil(searchFiltered.length / pageSize));
  const paginated = searchFiltered.slice((page - 1) * pageSize, page * pageSize);

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setSearch("");
    setPage(1);
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const COLUMNS: Column<PriorityRule>[] = [
    {
      key: "level",
      label: "Nível",
      width: "80px",
      align: "center",
      render: (r) => (
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
            r.level === 1
              ? "bg-primary/15 text-primary"
              : r.level === 2
                ? "bg-secondary/15 text-secondary"
                : r.level === 3
                  ? "bg-tertiary/15 text-tertiary"
                  : "bg-outline-variant/30 text-on-surface-variant"
          }`}
        >
          {r.level}
        </span>
      ),
    },
    {
      key: "name",
      label: "Nome",
      render: (r) => (
        <div>
          <p className="font-semibold text-on-surface text-sm">{r.name}</p>
          {r.description && (
            <p className="text-xs text-on-surface-variant truncate max-w-xs">{r.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "criteria",
      label: "Critérios",
      render: (r) => (
        <span className="text-sm text-on-surface-variant">
          {r.criteria.length === 0
            ? "Nenhum"
            : `${r.criteria.length} critério${r.criteria.length > 1 ? "s" : ""} (${r.criteriaLogic === "all" ? "todos" : "qualquer"})`}
        </span>
      ),
    },
    {
      key: "sortOrder",
      label: "Ordem",
      align: "right",
      width: "80px",
      render: (r) => (
        <span className="text-sm text-on-surface-variant">{r.sortOrder}</span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      align: "right",
      width: "96px",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToggleError("");
              setToggleTarget(r);
            }}
            title={r.active ? "Desativar" : "Ativar"}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {r.active ? (
              <ToggleRight className="w-4 h-4 text-success" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
            title="Editar"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Regras de Prioridade</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure os critérios que determinam a ordem de alocação de vagas nos ônibus
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            add
          </span>
          Nova Regra
        </button>
      </div>

      {/* Stats cards */}
      {!loading && rules.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <DashboardStatCard
            icon={ShieldCheck}
            label="Total de Regras"
            value={rules.length}
            badge="TOTAL"
            accent="primary"
          />
          <DashboardStatCard
            icon={ToggleRight}
            label="Regras Ativas"
            value={rules.filter((r) => r.active).length}
            badge="ATIVAS"
            accent="secondary"
          />
          <DashboardStatCard
            icon={ToggleLeft}
            label="Regras Inativas"
            value={rules.filter((r) => !r.active).length}
            badge="INATIVAS"
            accent="tertiary"
          />
          <DashboardStatCard
            icon={ShieldCheck}
            label="Níveis em uso"
            value={new Set(rules.filter((r) => r.active).map((r) => r.level)).size}
            badge="NÍVEIS"
            accent="primary"
          />
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={COLUMNS}
        rows={paginated}
        rowKey={(r) => r._id}
        loading={loading}
        error={error ? <ErrorState message={error} onRetry={() => void loadRules()} /> : undefined}
        empty={
          <EmptyState
            title="Nenhuma regra encontrada"
            description={
              search
                ? "Tente outro termo de busca."
                : tab === "active"
                  ? "Nenhuma regra ativa cadastrada."
                  : "Nenhuma regra inativa."
            }
          />
        }
        page={page}
        pageSize={pageSize}
        total={searchFiltered.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onRowClick={openEdit}
        header={
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-3 flex-wrap">
            <Tabs items={TAB_ITEMS} value={tab} onChange={handleTabChange} />
            <div className="ml-auto">
              <SearchInput
                value={search}
                onChange={handleSearch}
                placeholder="Buscar por nome ou nível..."
              />
            </div>
          </div>
        }
      />

      <PriorityRuleModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      {/* Toggle confirmation modal */}
      <Modal
        open={!!toggleTarget}
        onClose={() => { setToggleTarget(null); setToggleError(""); }}
        closeOnBackdrop={false}
        title={toggleTarget?.active ? "Desativar regra?" : "Ativar regra?"}
        size="sm"
      >
        <p className="text-sm text-on-surface-variant mb-1">
          {toggleTarget?.active ? (
            <>
              A regra <strong className="text-on-surface">{toggleTarget.name}</strong> será{" "}
              <span className="text-error font-medium">desativada</span> e deixará de ser
              avaliada em novas solicitações.
            </>
          ) : (
            <>
              A regra <strong className="text-on-surface">{toggleTarget?.name}</strong> será{" "}
              <span className="text-success font-medium">ativada</span> e passará a ser
              avaliada em novas solicitações.
            </>
          )}
        </p>
        <p className="text-sm text-on-surface-variant mt-2 mb-5">Tem certeza que deseja continuar?</p>

        {toggleError && (
          <p className="text-sm text-error mb-4">{toggleError}</p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => { setToggleTarget(null); setToggleError(""); }}
            disabled={toggleLoading}
          >
            Não
          </Button>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            loading={toggleLoading}
            onClick={() => void confirmToggle()}
            className={
              toggleTarget?.active
                ? "bg-error hover:bg-error/90 text-white border-0"
                : ""
            }
          >
            Sim
          </Button>
        </div>
      </Modal>
    </div>
  );
}
