"use client";

import { useState } from "react";
import { Plus, GraduationCap, BookOpen, Pencil, Ban, Hourglass } from "lucide-react";
import type { Course, CourseModel, University } from "@/types/university.types";
import { courseApi } from "@/lib/universityApi";
import { CourseFormModal } from "./CourseFormModal";

interface Props {
  university: University;
  courses: Course[];
  onCoursesChanged: () => void;
}

export function CoursesPanel({ university, courses, onCoursesChanged }: Props) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const handleCreate = async (data: { name: string; model: CourseModel | null }) => {
    await courseApi.create({ name: data.name, universityId: university._id, ...(data.model ? { model: data.model } : {}) });
    onCoursesChanged();
  };

  const handleEdit = async (data: { name: string; model: CourseModel | null }) => {
    if (!editing) return;
    await courseApi.update(editing._id, { name: data.name, model: data.model ?? undefined });
    onCoursesChanged();
  };

  const handleDeactivate = async (courseId: string) => {
    setDeactivating(courseId);
    try {
      await courseApi.deactivate(courseId);
      onCoursesChanged();
    } finally {
      setDeactivating(null);
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

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-on-surface-muted">
          <GraduationCap className="size-10 mb-2" />
          <p className="text-sm">Nenhum curso cadastrado</p>
          <p className="text-xs mt-1">Clique em &quot;Novo curso&quot; para começar</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
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
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(course)}
                  className="p-1.5 rounded-lg text-on-surface-muted hover:text-info hover:bg-info-container transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-info/30"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => handleDeactivate(course._id)}
                  disabled={deactivating === course._id}
                  className="p-1.5 rounded-lg text-on-surface-muted hover:text-error hover:bg-error-container transition-colors cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-error/30"
                  title="Desativar"
                >
                  {deactivating === course._id
                    ? <Hourglass className="size-4" />
                    : <Ban className="size-4" />
                  }
                </button>
              </div>
            </li>
          ))}
        </ul>
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
    </div>
  );
}
