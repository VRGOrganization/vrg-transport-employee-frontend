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
      const data = await busApi.list();
      setBuses(data);
    } catch {
      setError("Não foi possível carregar os ônibus.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBuses(); }, [loadBuses]);

  const handleCreate = async (data: { identifier: string; capacity: number }) => {
    await busApi.create(data);
    await loadBuses();
  };

  const handleEdit = async (data: { identifier: string; capacity: number }) => {
    if (!editing) return;
    await busApi.update(editing._id, data);
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
    <div className="flex min-h-screen bg-surface">
      <SideNav activePath="/admin/buses" onLogout={logout} />

      <div className="flex-1 ml-64 flex flex-col">
        <TopBar user={user} />

        <main className="mt-16 p-8 min-h-[calc(100vh-4rem)]">
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
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              Novo Ônibus
            </button>
          </div>

          {/* Resumo */}
          {!loading && buses.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Ônibus ativos",
                  value: buses.length,
                  icon: "directions_bus",
                  color: "blue",
                },
                {
                  label: "Total de vagas",
                  value: buses.reduce((acc, b) => acc + b.capacity, 0),
                  icon: "event_seat",
                  color: "emerald",
                },
                {
                  label: "Faculdades cobertas",
                  value: new Set(
                    buses.flatMap((b) =>
                      b.universityIds.map((u) => (typeof u === "string" ? u : u._id))
                    )
                  ).size,
                  icon: "account_balance",
                  color: "purple",
                },
                {
                  label: "Sem vínculo",
                  value: buses.filter((b) => b.universityIds.length === 0).length,
                  icon: "link_off",
                  color: "amber",
                },
              ].map(({ label, value, icon, color }) => (
                <div
                  key={label}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm px-5 py-4 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-${color}-600`} style={{ fontSize: "20px" }}>
                      {icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                  </div>
                </div>
              ))}
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