"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollText, Users, Eraser } from "lucide-react";
import { auditService } from "@/services/auditService";
import type { AuditEvent, AuditFilters, AuditParticipant } from "@/types/audit";
import { AUDIT_CATEGORIES } from "@/lib/audit";
import { downloadAuditEvents } from "@/lib/auditDownload";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState, EmptyState } from "@/components/ui/states";
import type { PageSize } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AuditTimeline } from "./AuditTimeline";
import { AuditDetailModal } from "./AuditDetailModal";
import { DownloadFormatMenu } from "./DownloadFormatMenu";
import { AuditSelect } from "./AuditSelect";
import { ParticipantCombobox } from "./ParticipantCombobox";

const CATEGORY_OPTIONS = [
  { value: "", label: "Todas as ações" },
  ...AUDIT_CATEGORIES.map((c) => ({ value: c.key, label: c.label })),
];

const OUTCOME_OPTIONS = [
  { value: "", label: "Qualquer resultado" },
  { value: "success", label: "Sucesso" },
  { value: "failure", label: "Falha" },
];

const STAFF_ROLES = "admin,employee";

/**
 * Relatório de auditoria (admin). Timeline estilo git-log, filtros por tipo de
 * ação / pessoa / aluno / período, paginação server-side, seleção por destaque
 * (sem checkbox) e download em massa nos formatos JSON/PDF/CSV.
 */
export function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filtros
  const [category, setCategory] = useState("");
  const [outcome, setOutcome] = useState<"" | "success" | "failure">("");
  const [actorId, setActorId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [staffOnly, setStaffOnly] = useState(false);

  // participantes (para os selects)
  const [people, setPeople] = useState<AuditParticipant[]>([]);
  const [students, setStudents] = useState<AuditParticipant[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<AuditEvent | null>(null);

  const categoryPrefix = useMemo(() => {
    const found = AUDIT_CATEGORIES.find((c) => c.key === category);
    return found?.prefixes.find((p) => p.endsWith(".")) ?? found?.prefixes[0];
  }, [category]);

  // Carrega participantes uma vez.
  useEffect(() => {
    let alive = true;
    setPeopleLoading(true);
    Promise.all([
      auditService.participants(false),
      auditService.participants(true),
    ])
      .then(([all, onlyStudents]) => {
        if (!alive) return;
        setPeople(all);
        setStudents(onlyStudents);
      })
      .catch(() => {})
      .finally(() => alive && setPeopleLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const filters: AuditFilters = {
      page,
      limit: pageSize,
      ...(categoryPrefix ? { actionPrefix: categoryPrefix } : {}),
      ...(outcome ? { outcome } : {}),
      ...(actorId ? { actorId } : {}),
      ...(targetId ? { targetId } : {}),
      ...(staffOnly ? { actorRoles: STAFF_ROLES } : {}),
      ...(from ? { from: new Date(from).toISOString() } : {}),
      ...(to ? { to: new Date(`${to}T23:59:59`).toISOString() } : {}),
    };
    try {
      const result = await auditService.list(filters);
      setEvents(result.data ?? []);
      setTotal(result.total ?? 0);
    } catch {
      setError("Não foi possível carregar os registros de auditoria.");
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    categoryPrefix,
    outcome,
    actorId,
    targetId,
    staffOnly,
    from,
    to,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset de página quando filtros mudam.
  const filtersKey = `${categoryPrefix ?? ""}|${outcome}|${actorId}|${targetId}|${staffOnly}|${from}|${to}`;
  const prevFiltersKey = useRef(filtersKey);
  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) {
      prevFiltersKey.current = filtersKey;
      setPage(1);
    }
  }, [filtersKey]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected =
    events.length > 0 && events.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (events.every((e) => prev.has(e.id))) {
        const next = new Set(prev);
        for (const e of events) next.delete(e.id);
        return next;
      }
      const next = new Set(prev);
      for (const e of events) next.add(e.id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedEvents = useMemo(
    () => events.filter((e) => selectedIds.has(e.id)),
    [events, selectedIds],
  );

  return (
    <main className="px-6 py-5 flex flex-col gap-4 min-h-0">
      <header className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <ScrollText className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-on-surface">
            Relatório de Auditoria
          </h1>
          <p className="text-sm text-on-surface-variant">
            Toda movimentação feita por administradores e funcionários.
          </p>
        </div>
      </header>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
        <AuditSelect
          label="Tipo de ação"
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={setCategory}
        />
        <AuditSelect
          label="Resultado"
          value={outcome}
          options={OUTCOME_OPTIONS}
          onChange={(v) => setOutcome(v as "" | "success" | "failure")}
        />
        <ParticipantCombobox
          label="Pessoa"
          value={actorId}
          participants={people}
          loading={peopleLoading}
          onChange={setActorId}
          highlightStaff
        />
        <ParticipantCombobox
          label="Aluno"
          value={targetId}
          participants={students}
          loading={peopleLoading}
          onChange={setTargetId}
        />
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">
            De
          </label>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full h-11 px-3 rounded-lg text-sm bg-surface-container-lowest text-on-surface ring-1 ring-outline/40 hover:ring-outline focus:ring-2 focus:ring-primary outline-none transition-all cursor-text"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">
            Até
          </label>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="w-full h-11 px-3 rounded-lg text-sm bg-surface-container-lowest text-on-surface ring-1 ring-outline/40 hover:ring-outline focus:ring-2 focus:ring-primary outline-none transition-all cursor-text"
          />
        </div>
      </div>

      {/* Toggle "Apenas Funcionários" */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStaffOnly((v) => !v)}
          aria-pressed={staffOnly}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-semibold transition-all cursor-pointer",
            staffOnly
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-surface-container-high text-on-surface ring-1 ring-outline-variant/60 hover:bg-surface-container-highest",
          )}
        >
          <Users className="size-4" />
          Apenas Funcionários
        </button>
      </div>

      {/* Barra de seleção / download em massa */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl bg-surface-container-low px-4 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={events.length === 0}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold text-on-surface ring-1 ring-outline-variant/50 hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {allSelected ? "Limpar seleção da página" : "Selecionar tudo (página)"}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold text-on-surface ring-1 ring-outline-variant/50 hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Eraser className="size-4" />
            Desmarcar
          </button>
          <span className="text-sm text-on-surface-variant">
            {selectedIds.size > 0
              ? `${selectedIds.size} selecionado(s)`
              : "Nenhum selecionado"}
          </span>
        </div>
        <DownloadFormatMenu
          label={
            selectedIds.size > 0
              ? `Baixar ${selectedIds.size} selecionado(s)`
              : "Baixar página"
          }
          disabled={loading || events.length === 0}
          onPick={(format) =>
            downloadAuditEvents(
              selectedEvents.length > 0 ? selectedEvents : events,
              format,
            )
          }
        />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-surface-container-low animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : events.length === 0 ? (
          <EmptyState
            title="Nenhum registro encontrado"
            description="Ajuste os filtros para ver outras movimentações."
          />
        ) : (
          <AuditTimeline
            events={events}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onOpen={setDetail}
          />
        )}
      </div>

      {!loading && !error && total > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      )}

      <AuditDetailModal event={detail} onClose={() => setDetail(null)} />
    </main>
  );
}
