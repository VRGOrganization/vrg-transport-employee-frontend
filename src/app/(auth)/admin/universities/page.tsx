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
import { Plus, MapPin, BookOpen, Bus as BusIcon, Building2, AlertCircle, X } from "lucide-react";

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
  const [coursesError, setCoursesError] = useState("");

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
    setCoursesError("");
    try {
      const data = await courseApi.listByUniversity(universityId);
      setCourses(data);
    } catch (err: any) {
      console.error("[loadCourses] erro:", err);
      setCourses([]);
      setCoursesError(err?.message ?? "Não foi possível carregar os cursos.");
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
    setCourses([]);
    setCoursesError("");
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
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav activePath="/admin/universities" onLogout={logout} />

      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />

        <main className="p-8 min-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">
                Gerenciamento de Instituições
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Cadastre faculdades, gerencie cursos e vincule ônibus
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Nova Faculdade
            </button>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-error-container border border-error/30 rounded-xl text-sm text-error">
              {error}
            </div>
          )}

          {/* Layout: tabela + painel lateral */}
          <div className="flex gap-6 items-start">

            {/* Coluna esquerda — lista de faculdades */}
            <div className="w-96 shrink-0 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
                  Faculdades ativas
                </h2>
                <span className="text-xs bg-info-container text-info px-2 py-0.5 rounded-full font-medium">
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
              <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
                {/* Cabeçalho do painel */}
                <div className="px-6 pt-6 pb-0 border-b border-outline-variant">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-on-surface">
                        {selected.acronym}
                        <span className="ml-2 text-base font-normal text-on-surface-muted">·</span>
                        <span className="ml-2 text-base font-normal text-on-surface-variant">
                          {selected.name}
                        </span>
                      </h2>
                      <p className="text-xs text-on-surface-muted mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selected.address}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-1.5 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <X className="w-4.5 h-4.5" />
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
                            ? "border-primary text-primary"
                            : "border-transparent text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {tab === "courses" ? (
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            Cursos
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <BusIcon className="w-4 h-4" />
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
                          <div key={i} className="h-12 rounded-xl bg-surface-container-high animate-pulse" />
                        ))}
                      </div>
                    ) : coursesError ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <p className="text-sm text-error">{coursesError}</p>
                        <button
                          onClick={() => loadCourses(selected._id)}
                          className="mt-1 text-xs text-primary hover:underline"
                        >
                          Tentar novamente
                        </button>
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
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-on-surface-muted">
                <Building2 className="w-16 h-16 mb-4 text-on-surface-muted/40" />
                <p className="text-sm font-medium text-on-surface-variant">Selecione uma faculdade</p>
                <p className="text-xs text-on-surface-muted mt-1">
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
