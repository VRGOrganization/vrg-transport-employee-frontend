"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { universityApi, courseApi, busApi } from "@/lib/universityApi";
import type { University, Course, Bus } from "@/types/university.types";
import { UniversityTable } from "@/components/universities/UniversityTable";
import { InactiveCoursesTable } from "@/components/universities/InactiveCoursesTable";
import { CoursesPanel } from "@/components/universities/CoursesPanel";
import { LinkedBusesPanel } from "@/components/universities/LinkedBusesPanel";
import { UniversityFormModal } from "@/components/universities/UniversityFormModal";
import { DeactivateUniversityModal } from "@/components/universities/DeactivateUniversityModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { MapPin, BookOpen, Bus as BusIcon, Building2, AlertCircle, X, CheckCircle2, Ban, RotateCcw, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

type DetailTab = "courses" | "buses";
type StatusTab = "active" | "inactive" | "inactive-courses";
type SortOrder = "az" | "za" | "temp-first" | "fixed-first";
type CoverageFilter = "all" | "covered" | "uncovered";

const PAGE_SIZE = 5;

const STATUS_TABS = [
  { key: "active" as StatusTab,            label: "Ativas",             icon: CheckCircle2 },
  { key: "inactive" as StatusTab,          label: "Desativadas",        icon: Ban },
  { key: "inactive-courses" as StatusTab,  label: "Cursos desativados", icon: BookOpen },
];

export function UniversitiesPage({ role }: { role: "admin" | "employee" }) {
  void role;
  const [statusTab, setStatusTab] = useState<StatusTab>("active");
  const [sortOrder, setSortOrder] = useState<SortOrder>("az");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
  const [pendingDeactivate, setPendingDeactivate] = useState<University | null>(null);
  const [deactivateError, setDeactivateError] = useState("");
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [pendingReactivate, setPendingReactivate] = useState<University | null>(null);
  const [reactivateError, setReactivateError] = useState("");
  const [error, setError] = useState("");
  const [coursesError, setCoursesError] = useState("");
  const [inactiveCourses, setInactiveCourses] = useState<Course[]>([]);
  const [reactivatingCourseId, setReactivatingCourseId] = useState<string | null>(null);
  const [pendingReactivateCourse, setPendingReactivateCourse] = useState<Course | null>(null);
  const [reactivateCourseError, setReactivateCourseError] = useState("");

  const loadUniversities = useCallback(async () => {
    setLoadingUniversities(true);
    setError("");
    try {
      if (statusTab === "active") {
        const [unis, busList] = await Promise.all([
          universityApi.listWithQueueCounts(),
          busApi.listActive(),
        ]);
        setUniversities(unis);
        setBuses(busList);
      } else if (statusTab === "inactive") {
        const unis = await universityApi.listInactive();
        setUniversities(unis);
      } else {
        const courses = await courseApi.listInactive();
        setInactiveCourses(courses);
      }
    } catch {
      setError(statusTab === "inactive-courses" ? "Não foi possível carregar os cursos desativados." : "Não foi possível carregar as faculdades.");
    } finally {
      setLoadingUniversities(false);
    }
  }, [statusTab]);

  const loadCourses = useCallback(async (universityId: string) => {
    setLoadingCourses(true);
    setCoursesError("");
    try {
      const data = await courseApi.listByUniversity(universityId);
      setCourses(data);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.error("[loadCourses] erro:", err);
      setCourses([]);
      const message = err instanceof Error ? err.message : "Não foi possível carregar os cursos.";
      setCoursesError(message);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    setSelected(null);
    loadUniversities();
  }, [loadUniversities]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, sortOrder, coverageFilter, search]);

  useEffect(() => {
    if (statusTab !== "active") setCoverageFilter("all");
  }, [statusTab]);

  const sortedUniversities = useMemo(() => {
    const list = [...universities];
    const acronymCmp = (a: University, b: University) =>
      a.acronym.localeCompare(b.acronym, "pt-BR", { sensitivity: "base" });
    list.sort((a, b) => {
      switch (sortOrder) {
        case "az":
          return acronymCmp(a, b);
        case "za":
          return -acronymCmp(a, b);
        case "temp-first":
          return Number(Boolean(b.temporary)) - Number(Boolean(a.temporary)) || acronymCmp(a, b);
        case "fixed-first":
          return Number(Boolean(a.temporary)) - Number(Boolean(b.temporary)) || acronymCmp(a, b);
      }
    });
    return list;
  }, [universities, sortOrder]);

  const filteredUniversities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortedUniversities.filter((u) => {
      if (statusTab === "active" && coverageFilter !== "all") {
        if (coverageFilter === "covered" && !u.hasBus) return false;
        if (coverageFilter === "uncovered" && u.hasBus) return false;
      }
      if (!query) return true;
      return u.name.toLowerCase().includes(query) || u.acronym.toLowerCase().includes(query);
    });
  }, [sortedUniversities, search, statusTab, coverageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUniversities.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filteredUniversities.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filteredInactiveCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return inactiveCourses;
    return inactiveCourses.filter((c) => {
      const universityLabel =
        typeof c.universityId === "string"
          ? ""
          : `${c.universityId.acronym} ${c.universityId.name}`.toLowerCase();
      return c.name.toLowerCase().includes(query) || universityLabel.includes(query);
    });
  }, [inactiveCourses, search]);

  const courseTotalPages = Math.max(1, Math.ceil(filteredInactiveCourses.length / PAGE_SIZE));
  const courseSafePage = Math.min(currentPage, courseTotalPages);
  const coursePageItems = filteredInactiveCourses.slice(
    (courseSafePage - 1) * PAGE_SIZE,
    courseSafePage * PAGE_SIZE,
  );

  const handleSelect = (university: University | null) => {
    if (!university) {
      setSelected(null);
      return;
    }
    setSelected(university);
    setActiveTab("courses");
    setCourses([]);
    setCoursesError("");
    loadCourses(university._id);
  };

  const handleDeactivate = (id: string) => {
    const university = universities.find((u) => u._id === id) ?? null;
    setDeactivateError("");
    setPendingDeactivate(university);
  };

  const handleReactivate = (id: string) => {
    const university = universities.find((u) => u._id === id) ?? null;
    setReactivateError("");
    setPendingReactivate(university);
  };

  const handleConfirmReactivate = async () => {
    if (!pendingReactivate) return;
    setReactivatingId(pendingReactivate._id);
    setReactivateError("");
    try {
      await universityApi.reactivate(pendingReactivate._id);
      await loadUniversities();
      setPendingReactivate(null);
    } catch {
      setReactivateError("Não foi possível reativar a faculdade. Tente novamente.");
    } finally {
      setReactivatingId(null);
    }
  };

  const handleReactivateCourse = (id: string) => {
    const course = inactiveCourses.find((c) => c._id === id) ?? null;
    setReactivateCourseError("");
    setPendingReactivateCourse(course);
  };

  const handleConfirmReactivateCourse = async () => {
    if (!pendingReactivateCourse) return;
    setReactivatingCourseId(pendingReactivateCourse._id);
    setReactivateCourseError("");
    try {
      await courseApi.reactivate(pendingReactivateCourse._id);
      await loadUniversities();
      setPendingReactivateCourse(null);
    } catch (err) {
      const apiMessage = (err as { message?: string })?.message;
      setReactivateCourseError(apiMessage || "Não foi possível reativar o curso. Tente novamente.");
    } finally {
      setReactivatingCourseId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    setDeactivatingId(pendingDeactivate._id);
    setDeactivateError("");
    try {
      await universityApi.deactivate(pendingDeactivate._id);
      if (selected?._id === pendingDeactivate._id) setSelected(null);
      await loadUniversities();
      setPendingDeactivate(null);
    } catch (err) {
      const apiMessage = (err as { message?: string })?.message;
      setDeactivateError(apiMessage || "Não foi possível desativar a faculdade. Tente novamente.");
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
    await loadUniversities();
  };

  return (
    <>
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
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
              Adicionar universidade
            </Button>
          </div>

          <div className="mb-6">
            <Tabs items={STATUS_TABS} value={statusTab} onChange={setStatusTab} />
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-error-container border border-error/30 rounded-xl text-sm text-error">
              {error}
            </div>
          )}

          {/* Layout: tabela + painel lateral */}
          <div className="flex gap-6 items-start">

            {/* Coluna esquerda — lista de faculdades */}
            <div className={`shrink-0 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-5 ${statusTab === "active" ? "w-96" : "flex-1"}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
                  {statusTab === "active"
                    ? "Faculdades ativas"
                    : statusTab === "inactive"
                      ? "Faculdades desativadas"
                      : "Cursos desativados"}
                </h2>
                <span className="text-xs bg-info-container text-info px-2 py-0.5 rounded-full font-medium">
                  {statusTab === "inactive-courses" ? inactiveCourses.length : universities.length}
                </span>
              </div>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={
                  statusTab === "inactive-courses"
                    ? "Buscar por curso, faculdade ou sigla..."
                    : "Buscar por nome ou sigla..."
                }
                className="w-full mb-3"
              />

              {statusTab !== "inactive-courses" && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <ArrowUpDown className="size-3.5 text-on-surface-variant shrink-0" />
                  <label htmlFor="university-sort" className="text-xs text-on-surface-variant">Ordenar:</label>
                  <select
                    id="university-sort"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg px-2 py-1 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="az">Nome (A → Z)</option>
                    <option value="za">Nome (Z → A)</option>
                    <option value="temp-first">Temporárias primeiro</option>
                    <option value="fixed-first">Fixas primeiro</option>
                  </select>
                </div>
              )}

              {statusTab === "active" && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <label htmlFor="university-coverage" className="text-xs text-on-surface-variant">Cobertura:</label>
                  <select
                    id="university-coverage"
                    value={coverageFilter}
                    onChange={(e) => setCoverageFilter(e.target.value as CoverageFilter)}
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg px-2 py-1 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="all">Todas</option>
                    <option value="covered">Cobertas</option>
                    <option value="uncovered">Não cobertas</option>
                  </select>
                </div>
              )}

              {statusTab === "active" ? (
                <UniversityTable
                  universities={pageItems}
                  selectedId={selected?._id ?? null}
                  onSelect={handleSelect}
                  onEdit={(u) => setEditing(u)}
                  onDeactivate={handleDeactivate}
                  deactivatingId={deactivatingId}
                  loading={loadingUniversities}
                  {...(search.trim() && {
                    emptyTitle: "Nenhuma faculdade encontrada",
                    emptyDescription: "Tente buscar por outro nome ou sigla.",
                  })}
                />
              ) : statusTab === "inactive" ? (
                <UniversityTable
                  universities={pageItems}
                  loading={loadingUniversities}
                  onReactivate={handleReactivate}
                  reactivatingId={reactivatingId}
                  emptyTitle={search.trim() ? "Nenhuma faculdade encontrada" : "Nenhuma faculdade desativada"}
                  emptyDescription={search.trim() ? "Tente buscar por outro nome ou sigla." : "Faculdades desativadas aparecerão aqui."}
                />
              ) : (
                <InactiveCoursesTable
                  courses={coursePageItems}
                  loading={loadingUniversities}
                  onReactivate={handleReactivateCourse}
                  reactivatingId={reactivatingCourseId}
                  emptyTitle={search.trim() ? "Nenhum curso encontrado" : "Nenhum curso desativado"}
                  emptyDescription={search.trim() ? "Tente buscar por outro nome, faculdade ou sigla." : "Cursos desativados aparecerão aqui."}
                />
              )}

              {statusTab === "inactive-courses" ? (
                !loadingUniversities && filteredInactiveCourses.length > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant">
                    <span className="text-xs text-on-surface-variant">
                      Página {courseSafePage} de {courseTotalPages} · {filteredInactiveCourses.length} {filteredInactiveCourses.length === 1 ? "curso" : "cursos"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={courseSafePage <= 1}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(courseTotalPages, p + 1))}
                        disabled={courseSafePage >= courseTotalPages}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                )
              ) : (
                !loadingUniversities && filteredUniversities.length > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant">
                    <span className="text-xs text-on-surface-variant">
                      Página {safePage} de {totalPages} · {filteredUniversities.length} {filteredUniversities.length === 1 ? "faculdade" : "faculdades"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Coluna direita — painel de detalhes */}
            {statusTab === "active" && selected && (
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
                        <MapPin className="size-3.5" />
                        {selected.address}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-1.5 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <X className="size-4.5" />
                    </button>
                  </div>

                  {/* Abas */}
                  <div className="flex gap-1">
                    {(["courses", "buses"] as DetailTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          activeTab === tab
                            ? "border-primary text-primary"
                            : "border-transparent text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {tab === "courses" ? (
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="size-4" />
                            Cursos
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <BusIcon className="size-4" />
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
                        <AlertCircle className="size-10 text-error" />
                        <p className="text-sm text-error">{coursesError}</p>
                        <button
                          onClick={() => loadCourses(selected._id)}
                          className="mt-1 text-xs text-primary hover:underline cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30 rounded"
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
            )}
            {statusTab === "active" && !selected && (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-on-surface-muted">
                <Building2 className="size-16 mb-4 text-on-surface-muted/40" />
                <p className="text-sm font-medium text-on-surface-variant">Selecione uma faculdade</p>
                <p className="text-xs text-on-surface-muted mt-1">
                  para gerenciar seus cursos e ônibus
                </p>
              </div>
            )}
          </div>
        </main>

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
        onCoursesChanged={handleCoursesChanged}
      />
      <DeactivateUniversityModal
        university={pendingDeactivate}
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
        title="Reativar Faculdade"
        icon={RotateCcw}
        variant="success"
        confirmLabel="Sim, reativar"
        description={
          pendingReactivate && (
            <>
              <p className="text-base font-bold text-on-surface">{pendingReactivate.acronym}</p>
              <p className="text-sm text-on-surface-variant mb-2">{pendingReactivate.name}</p>
              <p>Esta ação reativará a faculdade. Ela voltará a aparecer para novos cadastros.</p>
            </>
          )
        }
      />
      <ConfirmModal
        open={!!pendingReactivateCourse}
        onClose={() => { setPendingReactivateCourse(null); setReactivateCourseError(""); }}
        onConfirm={handleConfirmReactivateCourse}
        loading={!!reactivatingCourseId}
        error={reactivateCourseError}
        title="Reativar Curso"
        icon={RotateCcw}
        variant="success"
        confirmLabel="Sim, reativar"
        description={
          pendingReactivateCourse && (
            <>
              <p className="text-base font-bold text-on-surface">{pendingReactivateCourse.name}</p>
              <p>Esta ação reativará o curso. Ele voltará a aparecer para novos cadastros.</p>
            </>
          )
        }
      />
    </>
  );
}
