"use client";

import { useCallback, useEffect, useState } from "react";
import { busApi } from "@/lib/universityApi";
import type { Bus } from "@/types/university.types";
import { BusTable } from "@/components/buses/BusTable";
import { BusFormModal } from "@/components/buses/BusFormModal";
import { BusStudentsDrawer } from "@/components/buses/BusStudentsDrawer";
import { DeactivateBusModal } from "@/components/buses/DeactivateBusModal";
import { Bus as BusIcon, Armchair, Building2, Unlink, CheckCircle2, Ban, RotateCcw } from "lucide-react";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";
import { Tabs } from "@/components/ui/Tabs";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type StatusTab = "active" | "inactive";

const STATUS_TABS = [
  { key: "active" as StatusTab,   label: "Ativos",      icon: CheckCircle2 },
  { key: "inactive" as StatusTab, label: "Desativados", icon: Ban },
];

export default function BusesPage() {
  const [statusTab, setStatusTab] = useState<StatusTab>("active");
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
      const data = statusTab === "active"
        ? await busApi.listWithQueueCounts()
        : await busApi.listInactive();
      setBuses(data);
    } catch {
      setError("Não foi possível carregar os ônibus.");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    loadBuses();
  }, [loadBuses]);

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
            {statusTab === "active" && (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">
                  add
                </span>
                Novo Ônibus
              </button>
            )}
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

          {statusTab === "active" ? (
            <BusTable
              buses={buses}
              loading={loading}
              onEdit={setEditing}
              onDeactivate={handleDeactivate}
              onViewStudents={setViewingStudents}
              deactivatingId={deactivatingId}
            />
          ) : (
            <BusTable
              buses={buses}
              loading={loading}
              onReactivate={handleReactivate}
              reactivatingId={reactivatingId}
              emptyTitle="Nenhum ônibus desativado"
              emptyDescription="Ônibus desativados aparecerão aqui."
            />
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


