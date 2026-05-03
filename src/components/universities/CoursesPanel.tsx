"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Cursos ({courses.length})
        </h3>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
          Novo curso
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2">school</span>
          <p className="text-sm">Nenhum curso cadastrado</p>
          <p className="text-xs mt-1">Clique em "Novo curso" para começar</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
            <li
              key={course._id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500" style={{ fontSize: "18px" }}>
                  menu_book
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {course.name}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(course)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  title="Editar"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                </button>
                <button
                  onClick={() => handleDeactivate(course._id)}
                  disabled={deactivating === course._id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Desativar"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {deactivating === course._id ? "hourglass_empty" : "block"}
                  </span>
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