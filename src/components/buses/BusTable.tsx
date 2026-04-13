"use client";

import { cn } from "@/lib/utils";
import type { Bus } from "@/types/university.types";

interface Props {
  buses: Bus[];
  loading: boolean;
  onEdit: (bus: Bus) => void;
  onDeactivate: (id: string) => void;
  onViewStudents: (bus: Bus) => void;
  deactivatingId: string | null;
}

export function BusTable({ buses, loading, onEdit, onDeactivate, onViewStudents, deactivatingId }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <span className="material-symbols-outlined text-5xl mb-3">directions_bus</span>
        <p className="text-sm font-medium">Nenhum ônibus cadastrado</p>
        <p className="text-xs mt-1">Clique em "Novo Ônibus" para começar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {buses.map((bus) => (
        <div
          key={bus._id}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm p-5 flex flex-col gap-4"
        >
          {/* Header do card */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600" style={{ fontSize: "20px" }}>
                  directions_bus
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {bus.identifier}
                </p>
                <p className="text-xs text-slate-400">{bus.capacity} vagas</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(bus)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                title="Editar"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
              </button>
              <button
                onClick={() => onDeactivate(bus._id)}
                disabled={deactivatingId === bus._id}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Desativar"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {deactivatingId === bus._id ? "hourglass_empty" : "block"}
                </span>
              </button>
            </div>
          </div>

          {/* Faculdades vinculadas */}
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Faculdades
            </p>
            {bus.universityIds.length === 0 ? (
              <p className="text-xs text-slate-300 dark:text-slate-600 italic">
                Nenhuma faculdade vinculada
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {bus.universityIds.map((u) => (
                  <span
                    key={typeof u === "string" ? u : u._id}
                    className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-600 dark:text-blue-400"
                  >
                    {typeof u === "string" ? u : u.acronym}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Botão de ver alunos */}
          <button
            onClick={() => onViewStudents(bus)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>groups</span>
            Ver alunos cadastrados
          </button>
        </div>
      ))}
    </div>
  );
}