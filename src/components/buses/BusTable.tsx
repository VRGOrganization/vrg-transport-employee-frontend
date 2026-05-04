"use client";

import { useEffect, useState } from "react";
import { Bus, Pencil, Ban, Hourglass, Users } from "lucide-react";
import { universityApi } from "@/lib/universityApi";
import type { Bus as BusType } from "@/types/university.types";

interface Props {
  buses: BusType[];
  loading: boolean;
  onEdit: (bus: BusType) => void;
  onDeactivate: (id: string) => void;
  onViewStudents: (bus: BusType) => void;
  deactivatingId: string | null;
}

export function BusTable({ buses, loading, onEdit, onDeactivate, onViewStudents, deactivatingId }: Props) {
  const [universitiesMap, setUniversitiesMap] = useState<Record<string, { acronym?: string; name?: string }>>({});

  useEffect(() => {
    let cancelled = false;

    const collectAndLoad = async () => {
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
      } catch {
        // ignore
      }
    };

    void collectAndLoad();
    return () => { cancelled = true; };
  }, [buses]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-muted">
        <Bus className="w-12 h-12 mb-3" />
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
          className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-5 flex flex-col gap-4"
        >
          {/* Header do card */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info-container flex items-center justify-center">
                <Bus className="text-info w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span>{bus.identifier}</span>
                  {bus.shift && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                      {bus.shift}
                    </span>
                  )}
                </p>
                <p className="text-xs text-on-surface-muted">
                  {bus.capacity == null
                    ? "Sem limite"
                    : `${bus.filledSlotsTotal ?? 0} / ${bus.capacity} vagas`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bus.waitlistedCount && bus.waitlistedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-warning-container text-on-warning text-xs font-medium">
                  Fila: {bus.waitlistedCount}
                </span>
              )}
              <button
                onClick={() => onEdit(bus)}
                className="p-1.5 rounded-lg text-on-surface-muted hover:text-info hover:bg-info-container transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeactivate(bus._id)}
                disabled={deactivatingId === bus._id}
                className="p-1.5 rounded-lg text-on-surface-muted hover:text-error hover:bg-error-container transition-colors"
                title="Desativar"
              >
                {deactivatingId === bus._id
                  ? <Hourglass className="w-4 h-4" />
                  : <Ban className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Faculdades vinculadas */}
          <div>
            <p className="text-[10px] font-medium text-on-surface-muted uppercase tracking-wide mb-2">
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
                      <span key={idKey} className="px-2.5 py-0.5 rounded-full bg-info-container text-xs font-medium text-info">
                        {display}
                        <span className="ml-2 text-[10px] text-on-surface-muted">P{u.priorityOrder}{u.filledSlots != null ? ` • ${u.filledSlots}` : ""}</span>
                      </span>
                    );
                  })}
              </div>
            ) : ((bus.universityIds ?? []).length === 0 ? (
              <p className="text-xs text-outline-variant italic">
                Nenhuma faculdade vinculada
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(bus.universityIds ?? []).map((u) => {
                  const idKey = typeof u === "string" ? u : u._id;
                  const display = typeof u === "string" ? universitiesMap[idKey]?.acronym ?? universitiesMap[idKey]?.name ?? idKey : (u.acronym ?? u.name ?? idKey);
                  return (
                    <span key={idKey} className="px-2.5 py-0.5 rounded-full bg-info-container text-xs font-medium text-info">
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-xs font-medium hover:bg-surface-container-low hover:text-info transition-colors"
          >
            <Users className="w-4 h-4" />
            Ver alunos cadastrados
          </button>
        </div>
      ))}
    </div>
  );
}
