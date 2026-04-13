"use client";

import { useCallback, useEffect, useState } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { universityApi, courseApi, busApi } from "@/lib/universityApi";
import type { University, Course, Bus } from "@/types/university.types";
import { UniversityTable } from "@/components/universities/UniversityTable";
import { CoursesPanel } from "@/components/universities/CoursesPanel";
import { LinkedBusesPanel } from "@/components/universities/LinkedBusesPanel";
import { UniversityFormModal } from "@/components/universities/UniversityFormModal";

type DetailTab = "courses" | "buses";

export default function UniversitiesPage() {
  const { user, logout } = useEmployeeAuth();

  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selected, setSelected] = useState<University | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("courses");
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadUniversities = useCallback(async () => {
    setLoadingUniversities(true);
    setError("");
    try {
      const [unis, busList] = await Promise.all([
        universityApi.list(),
        busApi.list(),
      ]);
      setUniversities(unis);
      setBuses(busList);
    } catch {
      setError("Não foi possível carregar as faculdades.");
    } finally {
      setLoadingUniversities(false);
    }
  }, []);

  const loadCourses = useCallback(async (universityId: string) => {
    setLoadingCourses(true);
    try {
      const data = await courseApi.listByUniversity(universityId);
      setCourses(data);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  const handleSelect = (university: University) => {
    setSelected(university);
    setActiveTab("courses");
    loadCourses(university._id);
  };

  const handleDeactivate = async (id: string) => {
    setDeactivatingId(id);
    try {
      await universityApi.deactivate(id);
      if (selected?._id === id) setSelected(null);
      await loadUniversities();
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleCreate = async (data: { name: string; acronym: string; address: string }) => {
    await universityApi.create(data);
    await loadUniversities();
  };

  const handleEdit = async (data: { name: string; acronym: string; address: string }) => {
    if (!editing) return;
    await universityApi.update(editing._id, data);
    await loadUniversities();
    if (selected?._id === editing._id) {
      const updated = universities.find((u) => u._id === editing._id);
      if (updated) setSelected({ ...updated, ...data });
    }
  };

  const handleCoursesChanged = () => {
    if (selected) loadCourses(selected._id);
  };

  const handleBusesChanged = async () => {
    const busList = await busApi.list();
    setBuses(busList);
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <SideNav activePath="/admin/universities" onLogout={logout} />

      <div className="flex-1 ml-64 flex flex-col">
        <TopBar user={user} />

        <main className="mt-16 p-8 min-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">
                Gerenciamento de Instituições
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Cadastre faculdades, gerencie cursos e vincule ônibus
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              Nova Faculdade
            </button>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Layout: tabela + painel lateral */}
          <div className="flex gap-6 items-start">

            {/* Coluna esquerda — lista de faculdades */}
            <div className="w-96 flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  Faculdades ativas
                </h2>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {universities.length}
                </span>
              </div>

              <UniversityTable
                universities={universities}
                selectedId={selected?._id ?? null}
                onSelect={handleSelect}
                onEdit={(u) => setEditing(u)}
                onDeactivate={handleDeactivate}
                deactivatingId={deactivatingId}
                loading={loadingUniversities}
              />
            </div>

            {/* Coluna direita — painel de detalhes */}
            {selected ? (
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                {/* Cabeçalho do painel */}
                <div className="px-6 pt-6 pb-0 border-b border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {selected.acronym}
                        <span className="ml-2 text-base font-normal text-slate-400">·</span>
                        <span className="ml-2 text-base font-normal text-slate-500 dark:text-slate-400">
                          {selected.name}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                          location_on
                        </span>
                        {selected.address}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                    </button>
                  </div>

                  {/* Abas */}
                  <div className="flex gap-1">
                    {(["courses", "buses"] as DetailTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                          activeTab === tab
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        {tab === "courses" ? (
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>menu_book</span>
                            Cursos
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>directions_bus</span>
                            Ônibus
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conteúdo da aba */}
                <div className="p-6">
                  {activeTab === "courses" && (
                    loadingCourses ? (
                      <div className="flex flex-col gap-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <CoursesPanel
                        university={selected}
                        courses={courses}
                        onCoursesChanged={handleCoursesChanged}
                      />
                    )
                  )}

                  {activeTab === "buses" && (
                    <LinkedBusesPanel
                      university={selected}
                      allBuses={buses}
                      onBusesChanged={handleBusesChanged}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-300 dark:text-slate-600">
                <span className="material-symbols-outlined text-6xl mb-4">account_balance</span>
                <p className="text-sm font-medium text-slate-400">Selecione uma faculdade</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                  para gerenciar seus cursos e ônibus
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <UniversityFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />
      <UniversityFormModal
        open={!!editing}
        initial={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
    </div>
  );
}