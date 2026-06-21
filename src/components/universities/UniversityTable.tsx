"use client";

import { cn } from "@/lib/utils";
import { Landmark, Edit2, Ban, ChevronRight, Building2, RotateCcw } from "lucide-react";
import type { University } from "@/types/university.types";

interface Props {
  universities: University[];
  selectedId?: string | null;
  onSelect?: (university: University | null) => void;
  onEdit?: (university: University) => void;
  onDeactivate?: (id: string) => void;
  deactivatingId?: string | null;
  onReactivate?: (id: string) => void;
  reactivatingId?: string | null;
  loading: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function UniversityTable({
  universities,
  selectedId,
  onSelect,
  onEdit,
  onDeactivate,
  deactivatingId,
  onReactivate,
  reactivatingId,
  loading,
  emptyTitle = "Nenhuma faculdade cadastrada",
  emptyDescription = 'Clique em "Nova Faculdade" para começar',
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

  if (universities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
        <Building2 className="size-12 mb-3" />
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="text-xs mt-1">{emptyDescription}</p>
      </div>
    );
  }

  const interactive = Boolean(onSelect);

  return (
    <ul className="space-y-2">
      {universities.map((university) => {
        const isSelected = selectedId === university._id;
        return (
          <li key={university._id}>
            <div
              {...(interactive && {
                role: "button",
                tabIndex: 0,
                onClick: () => onSelect?.(isSelected ? null : university),
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelect?.(isSelected ? null : university);
                  }
                },
              })}
              className={cn(
                "w-full text-left px-5 py-4 rounded-xl border transition-all duration-150",
                interactive && "cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/8 shadow-sm"
                  : interactive
                    ? "border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low"
                    : "border-outline-variant bg-surface-container-lowest"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary" : "bg-surface-container-high"
                  )}>
                    <Landmark className={cn("size-4", isSelected ? "text-on-primary" : "text-on-surface-variant")} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      "text-sm font-semibold leading-tight truncate",
                      isSelected ? "text-primary" : "text-on-surface"
                    )}>
                      {university.acronym}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {university.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(university); }}
                      className="p-1.5 rounded-lg text-on-surface-muted hover:text-info hover:bg-info-container transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-info/30"
                      title="Editar"
                    >
                      <Edit2 className="size-4" />
                    </button>
                  )}
                  {onDeactivate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeactivate(university._id); }}
                      disabled={deactivatingId === university._id}
                      className="p-1.5 rounded-lg text-on-surface-muted hover:text-error hover:bg-error-container transition-colors cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-error/30"
                      title="Desativar"
                    >
                      {deactivatingId === university._id ? (
                        <ChevronRight className="size-4 animate-pulse" />
                      ) : (
                        <Ban className="size-4" />
                      )}
                    </button>
                  )}
                  {onReactivate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onReactivate(university._id); }}
                      disabled={reactivatingId === university._id}
                      className="p-1.5 rounded-lg text-on-surface-muted hover:text-success hover:bg-success-container transition-colors cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-success/30"
                      title="Reativar"
                    >
                      {reactivatingId === university._id ? (
                        <ChevronRight className="size-4 animate-pulse" />
                      ) : (
                        <RotateCcw className="size-4" />
                      )}
                    </button>
                  )}
                  {interactive && (
                    <span
                      title="Listar faculdades"
                      className={cn(
                        "ml-1 p-1.5 rounded-lg transition-all",
                        isSelected
                          ? "text-primary"
                          : "text-on-surface-muted hover:text-on-surface hover:bg-surface-container-high"
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          "size-4 transition-transform",
                          isSelected && "rotate-90"
                        )}
                      />
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-on-surface-muted mt-1.5 pl-12 truncate">
                {university.address}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
