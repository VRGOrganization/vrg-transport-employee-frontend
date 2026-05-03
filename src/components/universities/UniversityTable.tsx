"use client";

import { cn } from "@/lib/utils";
import { Landmark, Edit2, Slash, ChevronRight } from "lucide-react";
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
          <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (universities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <span className="material-symbols-outlined text-5xl mb-3">account_balance</span>
        <p className="text-sm font-medium">Nenhuma faculdade cadastrada</p>
        <p className="text-xs mt-1">Clique em "Nova Faculdade" para começar</p>
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
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                  : "border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 hover:border-blue-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    isSelected ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-700"
                  )}>
                    <Landmark className={cn("h-4 w-4", isSelected ? "text-white" : "text-slate-500 dark:text-slate-400")} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      "text-sm font-semibold leading-tight truncate",
                      isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-100"
                    )}>
                      {university.acronym}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {university.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(university); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeactivate(university._id); }}
                    disabled={deactivatingId === university._id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Desativar"
                  >
                    {deactivatingId === university._id ? (
                      <ChevronRight className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Slash className="h-4 w-4" />
                    )}
                  </button>
                  <ChevronRight className={cn("ml-1 transition-transform", isSelected ? "text-blue-500 rotate-90" : "text-slate-300")} />
                </div>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 pl-12 truncate">
                {university.address}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}