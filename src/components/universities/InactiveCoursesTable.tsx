"use client";

import { BookOpen, RotateCcw, ChevronRight, User } from "lucide-react";
import type { Course } from "@/types/university.types";
import { formatDateTimeBR } from "@/lib/utils/date";

interface Props {
  courses: Course[];
  onReactivate: (id: string) => void;
  reactivatingId: string | null;
  loading: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

function universityLabel(universityId: Course["universityId"]): string {
  if (typeof universityId === "string") return "—";
  return `${universityId.acronym} · ${universityId.name}`;
}

export function InactiveCoursesTable({
  courses,
  onReactivate,
  reactivatingId,
  loading,
  emptyTitle = "Nenhum Curso Desativado",
  emptyDescription = "Cursos Desativados Aparecerão Aqui.",
}: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
        <BookOpen className="size-12 mb-3" />
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="text-xs mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {courses.map((course) => (
        <li key={course._id}>
          <div className="w-full text-left px-5 py-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0 bg-surface-container-high">
                  <BookOpen className="size-4 text-on-surface-variant" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate text-on-surface">
                    {course.name}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {universityLabel(course.universityId)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onReactivate(course._id)}
                disabled={reactivatingId === course._id}
                className="p-1.5 rounded-lg text-on-surface-muted hover:text-success hover:bg-success-container transition-colors cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-success/30 shrink-0"
                title="Reativar"
              >
                {reactivatingId === course._id ? (
                  <ChevronRight className="size-4 animate-pulse" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
              </button>
            </div>

            <div className="mt-2 ml-12 flex items-center gap-1.5 flex-wrap text-[11px] text-on-surface-muted">
              <span className="inline-flex items-center gap-1">
                <User className="size-3" />
                Desativado Por {course.deactivatedByName ?? "Desconhecido"}
              </span>
              {course.deactivatedAt && (
                <span>· Em {formatDateTimeBR(course.deactivatedAt)}</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
