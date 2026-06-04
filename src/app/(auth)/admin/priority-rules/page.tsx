"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Pencil, ShieldCheck, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { priorityRuleService } from "@/services/priorityRuleService";
import type { PriorityRule } from "@/types/priorityRule";
import { PriorityRuleModal } from "@/components/admin/PriorityRuleModal";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState, EmptyState } from "@/components/ui/states";

type Tab = "active" | "inactive";

const TAB_ITEMS = [
  { key: "active"   as Tab, label: "Ativas",   icon: "check_circle" },
  { key: "inactive" as Tab, label: "Inativas", icon: "cancel" },
];

const LEVEL_STYLE: Record<number, string> = {
  1: "bg-primary/15 text-primary",
  2: "bg-secondary/15 text-secondary",
  3: "bg-tertiary/15 text-tertiary",
  4: "bg-outline-variant/30 text-on-surface-variant",
  5: "bg-outline-variant/20 text-on-surface-variant",
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Máxima",
  2: "Alta",
  3: "Média",
  4: "Baixa",
  5: "Padrão",
};

function criterionLabel(c: PriorityRule["criteria"][number]): string {
  switch (c.type) {
    case "has_disability":
      return "PCD";
    case "shift":
      return `Turno: ${c.value}`;
    case "transport_mode":
      return `Transporte: ${c.value}`;
    case "university_id":
      return "Faculdade específica";
    case "course_semester":
      return (c.operator === "less_or_equal" || c.operator === "less_than")
        ? `Até ${c.value}º semestre`
        : `A partir do ${c.value}º semestre`;
    case "distance_km":
      return (c.operator === "greater_than" || c.operator === "greater_or_equal")
        ? `Mais de ${c.value} km`
        : `Menos de ${c.value} km`;
    default: {
      const val = Array.isArray(c.value) ? c.value.join(", ") : String(c.value ?? "");
      return val ? `${c.type}: ${val}` : c.type;
    }
  }
}

export default function PriorityRulesPage() {
  const [rules, setRules]             = useState<PriorityRule[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [tab, setTab]                 = useState<Tab>("active");
  const [search, setSearch]           = useState("");
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<PriorityRule | null>(null);
  const [reordering, setReordering]   = useState<string | null>(null);
  const [toggleTarget, setToggleTarget]   = useState<PriorityRule | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError]     = useState("");

  const sorted = (list: PriorityRule[]) =>
    [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.level - b.level);

  const loadRules = useCallback(async () => {
    setLoading(true); setError("");
    try {
      setRules(sorted(await priorityRuleService.list()));
    } catch {
      setError("Não foi possível carregar as regras de prioridade.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRules(); }, [loadRules]);

  // ── Reorder ↑/↓ ──────────────────────────────────────────────────────────
  const handleMove = async (rule: PriorityRule, direction: "up" | "down") => {
    const visible = sorted(rules.filter((r) => r.active === (tab === "active")));
    const idx = visible.findIndex((r) => r._id === rule._id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= visible.length) return;

    const neighbor = visible[swapIdx];
    setReordering(rule._id);
    try {
      const [updA, updB] = await Promise.all([
        priorityRuleService.update(rule._id,     { sortOrder: neighbor.sortOrder }),
        priorityRuleService.update(neighbor._id, { sortOrder: rule.sortOrder }),
      ]);
      setRules((prev) =>
        sorted(prev.map((r) => {
          if (r._id === updA._id) return updA;
          if (r._id === updB._id) return updB;
          return r;
        }))
      );
    } catch {
      // silent — UI unchanged on error
    } finally {
      setReordering(null);
    }
  };

  // ── Toggle confirmation ───────────────────────────────────────────────────
  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true); setToggleError("");
    try {
      const updated = await priorityRuleService.toggle(toggleTarget._id);
      setRules((prev) => sorted(prev.map((r) => (r._id === toggleTarget._id ? updated : r))));
      setToggleTarget(null);
    } catch {
      setToggleError("Não foi possível alterar o status da regra. Tente novamente.");
    } finally {
      setToggleLoading(false);
    }
  };

  // ── CRUD callbacks ────────────────────────────────────────────────────────
  const handleSaved = (saved: PriorityRule) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r._id === saved._id);
      const next = idx >= 0 ? prev.map((r) => (r._id === saved._id ? saved : r)) : [...prev, saved];
      return sorted(next);
    });
    setModalOpen(false); setEditing(null);
  };

  const handleDeleted = (id: string) => {
    setRules((prev) => prev.filter((r) => r._id !== id));
    setModalOpen(false); setEditing(null);
  };

  // ── Filtered lists ────────────────────────────────────────────────────────
  const tabFiltered = rules.filter((r) => r.active === (tab === "active"));
  const displayed   = search.trim()
    ? tabFiltered.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase()) ||
          String(r.level).includes(search),
      )
    : tabFiltered;

  return (
    <div className="p-8 min-h-[calc(100vh-4rem)]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Regras de Prioridade</h1>
          <p className="text-sm text-on-surface-muted mt-1">
            Configure os critérios que determinam a ordem de alocação de vagas nos ônibus
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          Nova Regra
        </button>
      </div>

      {/* ── Stats ── */}
      {!loading && rules.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <DashboardStatCard icon={ShieldCheck}   label="Total"          value={rules.length}                                                                   badge="TOTAL"    accent="primary"   />
          <DashboardStatCard icon={ToggleRight}   label="Ativas"         value={rules.filter((r) => r.active).length}                                           badge="ATIVAS"   accent="secondary" />
          <DashboardStatCard icon={ToggleLeft}    label="Inativas"       value={rules.filter((r) => !r.active).length}                                          badge="INATIVAS" accent="tertiary"  />
          <DashboardStatCard icon={ShieldCheck}   label="Níveis em uso"  value={new Set(rules.filter((r) => r.active).map((r) => r.level)).size}                badge="NÍVEIS"   accent="primary"   />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <Tabs items={TAB_ITEMS} value={tab} onChange={(t) => { setTab(t); setSearch(""); }} />
        <div className="ml-auto">
          <SearchInput value={search} onChange={(v) => setSearch(v)} placeholder="Buscar por nome ou nível..." />
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadRules()} />
      ) : displayed.length === 0 ? (
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
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map((rule, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === displayed.length - 1;
            const moving  = reordering === rule._id;

            return (
              <div
                key={rule._id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 flex items-start gap-4 group hover:border-outline-variant/60 transition-colors"
              >
                {/* Level badge */}
                <div className={`flex flex-col items-center justify-center w-14 shrink-0 py-1.5 rounded-xl ${LEVEL_STYLE[rule.level] ?? LEVEL_STYLE[5]}`}>
                  <span className="text-sm font-extrabold leading-tight">{rule.level}ª</span>
                  <span className="text-[9px] font-semibold opacity-70 leading-tight">{LEVEL_LABELS[rule.level] ?? "Padrão"}</span>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-on-surface text-sm">{rule.name}</h3>
                  </div>

                  {rule.description && (
                    <p className="text-xs text-on-surface-variant mb-2">{rule.description}</p>
                  )}

                  {rule.criteria.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5 mt-2">
                      {rule.criteria.map((c, i) => (
                        <li
                          key={i}
                          className="text-[11px] px-2 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant"
                        >
                          {criterionLabel(c)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-on-surface-variant/50 italic mt-1">Sem critérios — aplica-se a todos</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  {/* Move up */}
                  <button
                    disabled={isFirst || moving}
                    onClick={() => void handleMove(rule, "up")}
                    title="Mover para cima"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="size-4" />
                  </button>

                  {/* Move down */}
                  <button
                    disabled={isLast || moving}
                    onClick={() => void handleMove(rule, "down")}
                    title="Mover para baixo"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="size-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => { setEditing(rule); setModalOpen(true); }}
                    title="Editar"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    <Pencil className="size-4" />
                  </button>

                  {/* Toggle active */}
                  <button
                    onClick={() => { setToggleError(""); setToggleTarget(rule); }}
                    title={rule.active ? "Desativar" : "Ativar"}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    {rule.active
                      ? <ToggleRight className="size-4 text-success" />
                      : <ToggleLeft  className="size-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Form modal ── */}
      <PriorityRuleModal
        open={modalOpen}
        initial={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      {/* ── Toggle confirmation modal ── */}
      <Modal
        open={!!toggleTarget}
        onClose={() => { setToggleTarget(null); setToggleError(""); }}
        closeOnBackdrop={false}
        title={toggleTarget?.active ? "Desativar regra?" : "Ativar regra?"}
        size="sm"
      >
        <p className="text-sm text-on-surface-variant mb-2">
          {toggleTarget?.active ? (
            <>A regra <strong className="text-on-surface">{toggleTarget.name}</strong> será{" "}
              <span className="text-error font-medium">desativada</span> e deixará de ser avaliada em novas solicitações.</>
          ) : (
            <>A regra <strong className="text-on-surface">{toggleTarget?.name}</strong> será{" "}
              <span className="text-success font-medium">ativada</span> e passará a ser avaliada em novas solicitações.</>
          )}
        </p>
        <p className="text-sm text-on-surface-variant mb-5">Tem certeza que deseja continuar?</p>
        {toggleError && <p className="text-sm text-error mb-4">{toggleError}</p>}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" fullWidth onClick={() => { setToggleTarget(null); setToggleError(""); }} disabled={toggleLoading}>
            Não
          </Button>
          <Button
            variant="primary" size="sm" fullWidth
            loading={toggleLoading}
            onClick={() => void confirmToggle()}
            className={toggleTarget?.active ? "bg-error hover:bg-error/90 text-white border-0" : ""}
          >
            Sim
          </Button>
        </div>
      </Modal>
    </div>
  );
}
