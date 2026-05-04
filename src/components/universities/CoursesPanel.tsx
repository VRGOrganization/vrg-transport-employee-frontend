"use client";

import { useState } from "react";
import { Plus, GraduationCap, BookOpen, Pencil, Ban, Hourglass } from "lucide-react";
import type { Course, University } from "@/types/university.types";
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

  const handleCreate = async (data: { name: string }) => {
    await courseApi.create({ name: data.name, universityId: university._id });
    onCoursesChanged();
  };

  const handleEdit = async (data: { name: string }) => {
    if (!editing) return;
    await courseApi.update(editing._id, data);
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo curso
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-on-surface-muted">
          <GraduationCap className="w-10 h-10 mb-2" />
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
              <div className="flex items-center gap-3">
                <BookOpen className="w-4.5 h-4.5 text-info" />
                <span className="text-sm font-medium text-on-surface">
                  {course.name}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(course)}
                  className="p-1.5 rounded-lg text-on-surface-muted hover:text-info hover:bg-info-container transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeactivate(course._id)}
                  disabled={deactivating === course._id}
                  className="p-1.5 rounded-lg text-on-surface-muted hover:text-error hover:bg-error-container transition-colors"
                  title="Desativar"
                >
                  {deactivating === course._id
                    ? <Hourglass className="w-4 h-4" />
                    : <Ban className="w-4 h-4" />
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
