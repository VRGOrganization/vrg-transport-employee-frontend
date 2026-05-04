"use client";

import { useCallback, useEffect, useState } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { busApi } from "@/lib/universityApi";
import type { Bus } from "@/types/university.types";
import { BusTable } from "@/components/buses/BusTable";
import { BusFormModal } from "@/components/buses/BusFormModal";
import { BusStudentsDrawer } from "@/components/buses/BusStudentsDrawer";
import { Bus as BusIcon, Armchair, Building2, Unlink } from "lucide-react";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";

export default function BusesPage() {
  const { user, logout } = useEmployeeAuth();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [viewingStudents, setViewingStudents] = useState<Bus | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadBuses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // usar endpoint que já traz contagens e slots preenchidos
      const data = await busApi.listWithQueueCounts();
      setBuses(data);
    } catch {
      setError("Não foi possível carregar os ônibus.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleDeactivate = async (id: string) => {
    setDeactivatingId(id);
    try {
      await busApi.deactivate(id);
      await loadBuses();
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav activePath="/admin/buses" onLogout={logout} />

      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />

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
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                add
              </span>
              Novo Ônibus
            </button>
          </div>

          {/* Resumo */}
          {!loading && buses.length > 0 && (
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
            <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <BusTable
            buses={buses}
            loading={loading}
            onEdit={setEditing}
            onDeactivate={handleDeactivate}
            onViewStudents={setViewingStudents}
            deactivatingId={deactivatingId}
          />
        </main>
      </div>

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
    </div>
  );
}


