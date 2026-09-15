"use client";

import { useState, useEffect } from "react";
import { Plus, GraduationCap, BookOpen, Pencil, Ban, ChevronLeft, ChevronRight, SearchX, ArrowUpDown } from "lucide-react";
import type { Course, CourseModel, University } from "@/types/university.types";
import { COURSE_MODEL_OPTIONS } from "@/types/university.types";
import { courseApi } from "@/lib/universityApi";
import { CourseFormModal } from "./CourseFormModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchInput } from "@/components/ui/SearchInput";

const PAGE_SIZE = 10;

type CourseSortOrder = "az" | "za" | "model";

function Pagination({
  safePage,
  totalPages,
  total,
  onPage,
  className,
}: {
  safePage: number;
  totalPages: number;
  total: number;
  onPage: (fn: (p: number) => number) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <span className="text-xs text-on-surface-variant">
        Página {safePage} de {totalPages} · {total} cursos
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage((p) => Math.max(1, p - 1))}
          disabled={safePage <= 1}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage >= totalPages}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Próxima página"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  university: University;
  courses: Course[];
  onCoursesChanged: () => void;
}

export function CoursesPanel({ university, courses, onCoursesChanged }: Props) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<Course | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<CourseSortOrder>("az");

  useEffect(() => { setPage(1); }, [courses, search, sortOrder]);

  const sortedCourses = [...courses].sort((a, b) => {
    const nameCmp = a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    if (sortOrder === "za") return -nameCmp;
    if (sortOrder === "model") {
      const modelIndex = (course: Course) =>
        course.model ? COURSE_MODEL_OPTIONS.indexOf(course.model) : COURSE_MODEL_OPTIONS.length;
      return modelIndex(a) - modelIndex(b) || nameCmp;
    }
    return nameCmp;
  });

  const filteredCourses = sortedCourses.filter((course) =>
    course.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredCourses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCreate = async (data: { name: string; model: CourseModel | null }) => {
    await courseApi.create({ name: data.name, universityId: university._id, ...(data.model ? { model: data.model } : {}) });
    onCoursesChanged();
  };

  const handleEdit = async (data: { name: string; model: CourseModel | null }) => {
    if (!editing) return;
    await courseApi.update(editing._id, { name: data.name, model: data.model ?? undefined });
    onCoursesChanged();
  };

  const handleConfirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    setDeactivating(true);
    setDeactivateError("");
    try {
      await courseApi.deactivate(pendingDeactivate._id);
      setPendingDeactivate(null);
      onCoursesChanged();
    } catch (err) {
      const apiMessage = (err as { message?: string })?.message;
      setDeactivateError(apiMessage || "Não foi possível desativar o curso. Tente novamente.");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
          Cursos ({courses.length})
        </h3>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <Plus className="size-3.5" />
          Novo curso
        </button>
      </div>

      {courses.length > 0 && (
        <>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar curso por nome..."
            className="w-full mb-3"
          />
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpDown className="size-3.5 text-on-surface-variant shrink-0" />
            <label htmlFor="course-sort" className="text-xs text-on-surface-variant">Ordenar:</label>
            <select
              id="course-sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as CourseSortOrder)}
              className="text-xs bg-surface-container border border-outline-variant rounded-lg px-2 py-1 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="az">Nome (A → Z)</option>
              <option value="za">Nome (Z → A)</option>
              <option value="model">Tipo de curso</option>
            </select>
          </div>
        </>
      )}

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-on-surface-muted">
          <GraduationCap className="size-10 mb-2" />
          <p className="text-sm">Nenhum curso cadastrado</p>
          <p className="text-xs mt-1">Clique em &quot;Novo curso&quot; para começar</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-on-surface-muted">
          <SearchX className="size-10 mb-2" />
          <p className="text-sm">Nenhum curso encontrado</p>
          <p className="text-xs mt-1">Tente buscar por outro nome</p>
        </div>
      ) : (
        <>
          {totalPages > 1 && (
            <Pagination safePage={safePage} totalPages={totalPages} total={filteredCourses.length} onPage={setPage} className="mb-3 pb-3 border-b border-outline-variant" />
          )}

          <ul className="space-y-2">
            {pageItems.map((course) => (
              <li
                key={course._id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BookOpen className="size-4.5 text-info shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-on-surface truncate block">
                      {course.name}
                    </span>
                    {course.model && (
                      <span className="text-xs text-on-surface-muted">{course.model}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(course)}
                    className="p-1.5 rounded-lg text-on-surface-muted hover:text-info hover:bg-info-container transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-info/30"
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => { setDeactivateError(""); setPendingDeactivate(course); }}
                    className="p-1.5 rounded-lg text-on-surface-muted hover:text-error hover:bg-error-container transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-error/30"
                    title="Desativar"
                  >
                    <Ban className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination safePage={safePage} totalPages={totalPages} total={filteredCourses.length} onPage={setPage} className="mt-3 pt-3 border-t border-outline-variant" />
          )}
        </>
      )}

      <CourseFormModal
        open={creating}
        universityName={university.name}
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />
      <CourseFormModal
        open={!!editing}
        initial={editing}
        universityName={university.name}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
      <ConfirmModal
        open={!!pendingDeactivate}
        onClose={() => { setPendingDeactivate(null); setDeactivateError(""); }}
        onConfirm={handleConfirmDeactivate}
        loading={deactivating}
        error={deactivateError}
        title="Desativar Curso"
        icon={Ban}
        variant="danger"
        confirmLabel="Desativar"
        description={
          pendingDeactivate && (
            <>
              <p className="text-base font-bold text-on-surface">{pendingDeactivate.name}</p>
              {pendingDeactivate.model && (
                <p className="text-sm text-on-surface-variant mb-2">{pendingDeactivate.model}</p>
              )}
              <p>Esta ação desativará o curso. Ele não ficará mais disponível para novos cadastros.</p>
              <p className="text-xs text-on-surface-muted mt-2">
                Não é possível desativar se houver aluno com carteirinha aprovada vinculado a este curso.
              </p>
            </>
          )
        }
      />
    </div>
  );
}
