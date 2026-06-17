"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { busApi } from "@/lib/universityApi";
import { http } from "@/services/http";
import { resolvePaginated, type Paginated } from "@/types/api";
import { getApprovedBusStudents } from "@/lib/busStudents";
import type { Bus } from "@/types/university.types";
import type {
  LicenseRecord,
  LicenseRequestRecord,
  StudentRecord,
} from "@/types/cards.types";
import { BusTable } from "@/components/buses/BusTable";
import { BusFormModal } from "@/components/buses/BusFormModal";
import { BusStudentsDrawer } from "@/components/buses/BusStudentsDrawer";
import { DeactivateBusModal } from "@/components/buses/DeactivateBusModal";
import { Bus as BusIcon, Armchair, Building2, Unlink, CheckCircle2, Ban, RotateCcw, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";
import { Tabs } from "@/components/ui/Tabs";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type StatusTab = "active" | "inactive";
type SortOrder = "numeric" | "az" | "shift";

const STATUS_TABS = [
  { key: "active" as StatusTab,   label: "Ativos",      icon: CheckCircle2 },
  { key: "inactive" as StatusTab, label: "Desativados", icon: Ban },
];

const PAGE_SIZE_OPTIONS = [6, 12, 18] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

const SHIFT_ORDER: Record<string, number> = { morning: 0, afternoon: 1, night: 2 };

export default function BusesPage() {
  const [statusTab, setStatusTab] = useState<StatusTab>("active");
  const [sortOrder, setSortOrder] = useState<SortOrder>("numeric");
  const [pageSize, setPageSize] = useState<PageSize>(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [viewingStudents, setViewingStudents] = useState<Bus | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<Bus | null>(null);
  const [deactivateError, setDeactivateError] = useState("");
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [pendingReactivate, setPendingReactivate] = useState<Bus | null>(null);
  const [reactivateError, setReactivateError] = useState("");
  const [error, setError] = useState("");

  const loadBuses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, students, licenses, requests] = await Promise.all([
        statusTab === "active"
          ? busApi.listWithQueueCounts()
          : busApi.listInactive(),
        http.get<Paginated<StudentRecord>>("/student").then(resolvePaginated),
        http.get<Paginated<LicenseRecord>>("/license/all").then(resolvePaginated),
        http.get<Paginated<LicenseRequestRecord>>("/license-request").then(resolvePaginated),
      ]);
      // Recompute filled count from approved cards so the fleet card matches
      // exactly what /admin/cards shows under "Aprovados" for each bus.
      const withCounts = data.map((bus) => ({
        ...bus,
        filledSlotsTotal: getApprovedBusStudents(students, licenses, requests, bus).length,
      }));
      setBuses(withCounts);
    } catch {
      setError("Não foi possível carregar os ônibus.");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    loadBuses();
  }, [loadBuses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, sortOrder, pageSize]);

  const sortedBuses = useMemo(() => {
    const list = [...buses];
    if (sortOrder === "shift") {
      list.sort((a, b) => {
        const sa = a.shift && a.shift in SHIFT_ORDER ? SHIFT_ORDER[a.shift] : Number.POSITIVE_INFINITY;
        const sb = b.shift && b.shift in SHIFT_ORDER ? SHIFT_ORDER[b.shift] : Number.POSITIVE_INFINITY;
        if (sa !== sb) return sa - sb;
        return a.identifier.localeCompare(b.identifier, "pt-BR", { numeric: true, sensitivity: "base" });
      });
    } else {
      list.sort((a, b) =>
        a.identifier.localeCompare(b.identifier, "pt-BR", {
          numeric: sortOrder === "numeric",
          sensitivity: "base",
        })
      );
    }
    return list;
  }, [buses, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedBuses.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = sortedBuses.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleCreate = async (data: { identifier: string; capacity?: number | null; universitySlots?: Array<{ universityId: string; priorityOrder: number }>; shift?: string }) => {
    const created = await busApi.create({ identifier: data.identifier, capacity: data.capacity, ...(data.shift ? { shift: data.shift } : {}) });
    if (data.universitySlots && data.universitySlots.length > 0) {
      await busApi.updateUniversitySlots(created._id, data.universitySlots);
    }
    await loadBuses();
  };

  const handleEdit = async (data: { identifier: string; capacity?: number | null; universitySlots?: Array<{ universityId: string; priorityOrder: number }>; shift?: string }) => {
    if (!editing) return;
    await busApi.update(editing._id, { identifier: data.identifier, capacity: data.capacity, ...(data.shift ? { shift: data.shift } : {}) });
    if (data.universitySlots) {
      await busApi.updateUniversitySlots(editing._id, data.universitySlots);
    }
    await loadBuses();
  };

  const handleDeactivate = (id: string) => {
    const bus = buses.find((b) => b._id === id) ?? null;
    setDeactivateError("");
    setPendingDeactivate(bus);
  };

  const handleReactivate = (id: string) => {
    const bus = buses.find((b) => b._id === id) ?? null;
    setReactivateError("");
    setPendingReactivate(bus);
  };

  const handleConfirmReactivate = async () => {
    if (!pendingReactivate) return;
    setReactivatingId(pendingReactivate._id);
    setReactivateError("");
    try {
      await busApi.reactivate(pendingReactivate._id);
      await loadBuses();
      setPendingReactivate(null);
    } catch {
      setReactivateError("Não foi possível reativar o ônibus. Tente novamente.");
    } finally {
      setReactivatingId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    setDeactivatingId(pendingDeactivate._id);
    setDeactivateError("");
    try {
      await busApi.deactivate(pendingDeactivate._id);
      await loadBuses();
      setPendingDeactivate(null);
    } catch {
      setDeactivateError("Não foi possível desativar o ônibus. Tente novamente.");
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <>
      <main className="p-8 min-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">
                Gerenciamento de Ônibus
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Cadastre ônibus, defina capacidade e visualize alunos por linha
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">
                add
              </span>
              Novo Ônibus
            </button>
          </div>

          <div className="mb-6">
            <Tabs items={STATUS_TABS} value={statusTab} onChange={setStatusTab} />
          </div>

          {/* Resumo */}
          {statusTab === "active" && !loading && buses.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <DashboardStatCard
                icon={BusIcon}
                label="Ônibus Ativos"
                value={buses.length}
                badge="FROTA"
                accent="primary"
              />
              <DashboardStatCard
                icon={Armchair}
                label="Total de Vagas"
                value={buses.reduce((acc, b) => acc + (b.capacity ?? 0), 0)}
                badge="CAPACIDADE"
                accent="secondary"
              />
              <DashboardStatCard
                icon={Building2}
                label="Faculdades Cobertas"
                value={
                  new Set(
                    buses.flatMap((b) =>
                      (b.universitySlots ?? []).map((s) => (typeof s.universityId === "string" ? s.universityId : s.universityId._id))
                    )
                  ).size
                }
                badge="COBERTURA"
                accent="tertiary"
              />
              <DashboardStatCard
                icon={Unlink}
                label="Sem Vínculo"
                value={buses.filter((b) => (b.universitySlots ?? []).length === 0).length}
                badge="ATENÇÃO"
                accent="secondary"
              />
            </div>
          )}

          {error && (
            <StatusBanner variant="error" className="mb-6">{error}</StatusBanner>
          )}

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="size-3.5 text-on-surface-variant shrink-0" />
                <label htmlFor="bus-sort" className="text-xs text-on-surface-variant">Ordenar:</label>
                <select
                  id="bus-sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="text-xs bg-surface-container border border-outline-variant rounded-lg px-2 py-1 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="numeric">Numérico</option>
                  <option value="az">A → Z</option>
                  <option value="shift">Turno</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="bus-page-size" className="text-xs text-on-surface-variant">Por página:</label>
                <select
                  id="bus-page-size"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                  className="text-xs bg-surface-container border border-outline-variant rounded-lg px-2 py-1 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
            <span className="text-xs text-on-surface-variant">
              {sortedBuses.length} {sortedBuses.length === 1 ? "ônibus" : "ônibus"}
            </span>
          </div>

          {statusTab === "active" ? (
            <BusTable
              buses={pageItems}
              loading={loading}
              onEdit={setEditing}
              onDeactivate={handleDeactivate}
              onViewStudents={setViewingStudents}
              deactivatingId={deactivatingId}
            />
          ) : (
            <BusTable
              buses={pageItems}
              loading={loading}
              onReactivate={handleReactivate}
              reactivatingId={reactivatingId}
              emptyTitle="Nenhum ônibus desativado"
              emptyDescription="Ônibus desativados aparecerão aqui."
            />
          )}

          {!loading && sortedBuses.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant">
              <span className="text-xs text-on-surface-variant">
                Página {safePage} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </main>

      <BusFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />
      <BusFormModal
        open={!!editing}
        initial={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
      <BusStudentsDrawer
        bus={viewingStudents}
        onClose={() => setViewingStudents(null)}
      />
      <DeactivateBusModal
        bus={pendingDeactivate}
        onClose={() => { setPendingDeactivate(null); setDeactivateError(""); }}
        onConfirm={handleConfirmDeactivate}
        loading={!!deactivatingId}
        error={deactivateError}
      />
      <ConfirmModal
        open={!!pendingReactivate}
        onClose={() => { setPendingReactivate(null); setReactivateError(""); }}
        onConfirm={handleConfirmReactivate}
        loading={!!reactivatingId}
        error={reactivateError}
        title="Reativar Ônibus"
        icon={RotateCcw}
        variant="success"
        confirmLabel="Sim, reativar"
        description={
          pendingReactivate && (
            <>
              <p className="text-base font-bold text-on-surface">
                {pendingReactivate.identifier}
                {pendingReactivate.capacity != null && (
                  <span className="ml-2 text-sm font-normal text-on-surface-variant">
                    · {pendingReactivate.capacity} vagas
                  </span>
                )}
              </p>
              <p className="mt-2">Esta ação reativará o ônibus. Ele voltará a aparecer para novas alocações.</p>
            </>
          )
        }
      />
    </>
  );
}


