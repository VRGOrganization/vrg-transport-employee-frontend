"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { universityApi } from "@/lib/universityApi";
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
  const [universitiesMap, setUniversitiesMap] = useState<Record<string, { acronym?: string; name?: string }>>({});

  useEffect(() => {
    let cancelled = false;

    const collectAndLoad = async () => {
      // collect university ids that are strings
      const ids = new Set<string>();
      buses.forEach((b) => {
        const slots = (b.universitySlots ?? b.universityIds ?? []) as any[];
        slots.forEach((s) => {
          if (!s) return;
          if (s.universityId && typeof s.universityId === "string") ids.add(s.universityId);
          if (typeof s === "string") ids.add(s);
          if (s._id && typeof s._id === "string" && !s.acronym && !s.name) ids.add(s._id);
        });
      });

      if (ids.size === 0) return;

      try {
        const res = await universityApi.list();
        const arr = Array.isArray(res) ? res : (res as any)?.data ?? [];
        const map: Record<string, { acronym?: string; name?: string }> = {};
        arr.forEach((u: any) => {
          if (u && u._id) map[u._id] = { acronym: u.acronym, name: u.name };
        });
        if (!cancelled) setUniversitiesMap(map);
      } catch (e) {
        // ignore
      }
    };

    void collectAndLoad();

    return () => {
      cancelled = true;
    };
  }, [buses]);
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
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{bus.identifier}</span>
                  {bus.shift && (
                    <span className="text-xxs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {bus.shift}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {bus.capacity == null
                    ? "Sem limite"
                    : `${bus.filledSlotsTotal ?? 0} / ${bus.capacity} vagas`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bus.waitlistedCount && bus.waitlistedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-medium">
                  Fila: {bus.waitlistedCount}
                </span>
              )}
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
            {bus.universitySlots && bus.universitySlots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {bus.universitySlots
                  .slice()
                  .sort((a, b) => (a.priorityOrder ?? 0) - (b.priorityOrder ?? 0))
                  .map((u) => {
                    const idKey = typeof u.universityId === "string" ? u.universityId : (u.universityId?._id ?? "");
                    const display = typeof u.universityId === "string"
                      ? universitiesMap[idKey]?.acronym ?? universitiesMap[idKey]?.name ?? idKey
                      : (u.universityId?.acronym ?? u.universityId?.name ?? idKey);

                    return (
                      <span key={idKey} className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {display}
                        <span className="ml-2 text-xxs text-slate-400">P{u.priorityOrder}{u.filledSlots != null ? ` • ${u.filledSlots}` : ""}</span>
                      </span>
                    );
                  })}
              </div>
            ) : ( (bus.universityIds ?? []).length === 0 ? (
              <p className="text-xs text-slate-300 dark:text-slate-600 italic">
                Nenhuma faculdade vinculada
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(bus.universityIds ?? []).map((u) => {
                  const idKey = typeof u === "string" ? u : u._id;
                  const display = typeof u === "string" ? universitiesMap[idKey]?.acronym ?? universitiesMap[idKey]?.name ?? idKey : (u.acronym ?? u.name ?? idKey);
                  return (
                    <span
                      key={idKey}
                      className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-600 dark:text-blue-400"
                    >
                      {display}
                    </span>
                  );
                })}
              </div>
            ))}
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