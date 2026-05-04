"use client";

import { cn } from "@/lib/utils";
import { Landmark, Edit2, Slash, ChevronRight, Building2 } from "lucide-react";
import type { University } from "@/types/university.types";

interface Props {
  universities: University[];
  selectedId: string | null;
  onSelect: (university: University) => void;
  onEdit: (university: University) => void;
  onDeactivate: (id: string) => void;
  deactivatingId: string | null;
  loading: boolean;
}

export function UniversityTable({
  universities,
  selectedId,
  onSelect,
  onEdit,
  onDeactivate,
  deactivatingId,
  loading,
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
        <Building2 className="w-12 h-12 mb-3" />
        <p className="text-sm font-medium">Nenhuma faculdade cadastrada</p>
        <p className="text-xs mt-1">Clique em &quot;Nova Faculdade&quot; para começar</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {universities.map((university) => {
        const isSelected = selectedId === university._id;
        return (
          <li key={university._id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(university)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(university); }}
              className={cn(
                "w-full text-left px-5 py-4 rounded-xl border transition-all duration-150 cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/8 shadow-sm"
                  : "border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary" : "bg-surface-container-high"
                  )}>
                    <Landmark className={cn("h-4 w-4", isSelected ? "text-on-primary" : "text-on-surface-variant")} />
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
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(university); }}
                    className="p-1.5 rounded-lg text-on-surface-muted hover:text-info hover:bg-info-container transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeactivate(university._id); }}
                    disabled={deactivatingId === university._id}
                    className="p-1.5 rounded-lg text-on-surface-muted hover:text-error hover:bg-error-container transition-colors"
                    title="Desativar"
                  >
                    {deactivatingId === university._id ? (
                      <ChevronRight className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Slash className="h-4 w-4" />
                    )}
                  </button>
                  <ChevronRight className={cn("ml-1 transition-transform", isSelected ? "text-primary rotate-90" : "text-outline-variant")} />
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
