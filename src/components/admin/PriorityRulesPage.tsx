"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, ShieldCheck, ToggleLeft, ToggleRight, RotateCcw } from "lucide-react";
import { priorityRuleService } from "@/services/priorityRuleService";
import type { PriorityRule, ReactivationPreview, ReactivationResult } from "@/types/priorityRule";
import { PriorityRuleModal } from "@/components/admin/PriorityRuleModal";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { toast } from "@/lib/toast";
import type { ApiError } from "@/types/api";

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
  return c.type === "has_disability" ? "PCD" : "Já usa o sistema de transporte";
}

function applyReactivationResult(prev: PriorityRule[], result: ReactivationResult): PriorityRule[] {
  const byId = new Map(prev.map((r) => [r._id, r]));
  byId.set(result.reactivated._id, result.reactivated);
  for (const r of result.cascaded) byId.set(r._id, r);
  if (result.deactivated) byId.set(result.deactivated._id, result.deactivated);
  return Array.from(byId.values());
}

export function PriorityRulesPage({ role }: { role: "admin" | "employee" }) {
  void role;
  const [rules, setRules]             = useState<PriorityRule[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [tab, setTab]                 = useState<Tab>("active");
  const [search, setSearch]           = useState("");
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<PriorityRule | null>(null);

  const [deactivateTarget, setDeactivateTarget]   = useState<PriorityRule | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError]     = useState("");

  const [reactivatingId, setReactivatingId]           = useState<string | null>(null);
  const [reactivatePreview, setReactivatePreview]     = useState<ReactivationPreview | null>(null);
  const [reactivateLoading, setReactivateLoading]     = useState(false);
  const [reactivateError, setReactivateError]         = useState("");

  const sorted = (list: PriorityRule[]) => [...list].sort((a, b) => a.level - b.level);

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

  // ── Deactivate ─────────────────────────────────────────────────────────────
  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivateLoading(true); setDeactivateError("");
    try {
      await priorityRuleService.deactivate(deactivateTarget._id);
      await loadRules();
      setDeactivateTarget(null);
    } catch {
      setDeactivateError("Não foi possível desativar a regra. Tente novamente.");
    } finally {
      setDeactivateLoading(false);
    }
  };

  // ── Reactivate ─────────────────────────────────────────────────────────────
  const handleReactivate = async (rule: PriorityRule) => {
    setReactivatingId(rule._id);
    setReactivateError("");
    try {
      const result = await priorityRuleService.reactivate(rule._id, false);
      setRules((prev) => sorted(applyReactivationResult(prev, result)));
      setModalOpen(false); setEditing(null);
    } catch (err) {
      const apiErr = err as ApiError;
      const preview = (apiErr.details as { preview?: ReactivationPreview } | undefined)?.preview;
      if (apiErr.status === 409 && preview) {
        setReactivatePreview(preview);
      } else {
        toast.error(apiErr.message ?? "Não foi possível reativar a regra. Tente novamente.");
      }
    } finally {
      setReactivatingId(null);
    }
  };

  const confirmReactivate = async () => {
    if (!reactivatePreview) return;
    setReactivateLoading(true); setReactivateError("");
    try {
      const result = await priorityRuleService.reactivate(reactivatePreview.ruleId, true);
      setRules((prev) => sorted(applyReactivationResult(prev, result)));
      setReactivatePreview(null);
      setModalOpen(false); setEditing(null);
    } catch {
      setReactivateError("Não foi possível reativar a regra. Tente novamente.");
    } finally {
      setReactivateLoading(false);
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
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          Adicionar regra de prioridade
        </Button>
      </div>

      {/* ── Stats ── */}
      {!loading && rules.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <DashboardStatCard icon={ShieldCheck}   label="Total"          value={rules.length}                                    badge="TOTAL"    accent="primary"   />
          <DashboardStatCard icon={ToggleRight}   label="Ativas"         value={rules.filter((r) => r.active).length}           badge="ATIVAS"   accent="secondary" />
          <DashboardStatCard icon={ToggleLeft}    label="Inativas"       value={rules.filter((r) => !r.active).length}          badge="INATIVAS" accent="tertiary"  />
          <DashboardStatCard icon={ShieldCheck}   label="Níveis em uso"  value={rules.filter((r) => r.active).length}           badge="NÍVEIS"   accent="primary"   />
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
          {displayed.map((rule) => {
            const reactivating = reactivatingId === rule._id;

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

                  {rule.level !== rule.originalLevel && (
                    <p className="text-[11px] text-on-surface-variant/70 italic">
                      Criada como nível {rule.originalLevel}ª
                    </p>
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
                    <p className="text-xs text-on-surface-variant/50 italic mt-1">Sem critérios: aplica-se a todos</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  {/* Edit */}
                  <button
                    onClick={() => { setEditing(rule); setModalOpen(true); }}
                    title="Editar"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    <Pencil className="size-4" />
                  </button>

                  {rule.active ? (
                    <button
                      onClick={() => { setDeactivateError(""); setDeactivateTarget(rule); }}
                      title="Desativar"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <ToggleRight className="size-4 text-success" />
                    </button>
                  ) : (
                    <button
                      onClick={() => void handleReactivate(rule)}
                      disabled={reactivating}
                      title="Reativar"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className={`size-4 ${reactivating ? "animate-spin" : ""}`} />
                    </button>
                  )}
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
        onRequestReactivate={(rule) => void handleReactivate(rule)}
      />

      {/* ── Deactivate confirmation modal ── */}
      <Modal
        open={!!deactivateTarget}
        onClose={() => { setDeactivateTarget(null); setDeactivateError(""); }}
        closeOnBackdrop={false}
        title="Desativar regra?"
        size="sm"
      >
        <p className="text-sm text-on-surface-variant mb-2">
          A regra <strong className="text-on-surface">{deactivateTarget?.name}</strong> será{" "}
          <span className="text-error font-medium">desativada</span> e deixará de ser avaliada em novas solicitações.
        </p>
        <p className="text-sm text-on-surface-variant mb-5">Tem certeza que deseja continuar?</p>
        {deactivateError && <p className="text-sm text-error mb-4">{deactivateError}</p>}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" fullWidth onClick={() => { setDeactivateTarget(null); setDeactivateError(""); }} disabled={deactivateLoading}>
            Não
          </Button>
          <Button
            variant="primary" size="sm" fullWidth
            loading={deactivateLoading}
            onClick={() => void confirmDeactivate()}
            className="bg-error hover:bg-error/90 text-white border-0"
          >
            Sim, desativar
          </Button>
        </div>
      </Modal>

      {/* ── Reactivation preview/confirmation modal ── */}
      <Modal
        open={!!reactivatePreview}
        onClose={() => { setReactivatePreview(null); setReactivateError(""); }}
        closeOnBackdrop={false}
        title="Confirmar reativação"
        size="sm"
      >
        <p className="text-sm text-on-surface-variant mb-2">
          A regra <strong className="text-on-surface">{reactivatePreview?.ruleName}</strong> voltará ao nível{" "}
          <strong className="text-on-surface">{reactivatePreview?.targetLevel}ª ({LEVEL_LABELS[reactivatePreview?.targetLevel ?? 0]})</strong>.
        </p>
        {reactivatePreview?.willDeactivate && (
          <p className="text-sm text-on-surface-variant mb-5">
            Para isso, a regra <strong className="text-on-surface">{reactivatePreview.willDeactivate.ruleName}</strong>{" "}
            (atualmente nível {reactivatePreview.willDeactivate.level}ª) será{" "}
            <span className="text-error font-medium">desativada</span>.
          </p>
        )}
        {reactivateError && <p className="text-sm text-error mb-4">{reactivateError}</p>}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" fullWidth onClick={() => { setReactivatePreview(null); setReactivateError(""); }} disabled={reactivateLoading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" fullWidth loading={reactivateLoading} onClick={() => void confirmReactivate()}>
            Confirmar reativação
          </Button>
        </div>
      </Modal>
    </div>
  );
}
