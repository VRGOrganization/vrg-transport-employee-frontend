"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Bus, Plus, X, Hourglass, Unlink } from "lucide-react";
import type { Bus as BusType, University } from "@/types/university.types";
import { busApi } from "@/lib/universityApi";

interface Props {
  university: University;
  allBuses: BusType[];
  onBusesChanged: () => void;
}

export function LinkedBusesPanel({ university, allBuses, onBusesChanged }: Props) {
  const [linking, setLinking] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const linkedBuses = allBuses.filter((bus) => {
    const inSlots = (bus.universitySlots ?? []).some((s) =>
      typeof s.universityId === "string" ? s.universityId === university._id : s.universityId._id === university._id
    );
    const inIds = (bus.universityIds ?? []).some((u) =>
      typeof u === "string" ? u === university._id : u._id === university._id
    );
    return inSlots || inIds;
  });

  const availableBuses = allBuses.filter((bus) => {
    const inSlots = (bus.universitySlots ?? []).some((s) =>
      typeof s.universityId === "string" ? s.universityId === university._id : s.universityId._id === university._id
    );
    const inIds = (bus.universityIds ?? []).some((u) =>
      typeof u === "string" ? u === university._id : u._id === university._id
    );
    return !(inSlots || inIds);
  });

  const handleLink = async () => {
    if (!selectedBusId) return;
    setLoadingId(selectedBusId);
    try {
      await busApi.linkUniversity(selectedBusId, university._id);
      onBusesChanged();
      setLinking(false);
      setSelectedBusId("");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUnlink = async (busId: string) => {
    setLoadingId(busId);
    try {
      await busApi.unlinkUniversity(busId, university._id);
      onBusesChanged();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
          Ônibus vinculados ({linkedBuses.length})
        </h3>
        {availableBuses.length > 0 && (
          <button
            onClick={() => setLinking((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-success hover:bg-success/90 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {linking ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {linking ? "Cancelar" : "Vincular ônibus"}
          </button>
        )}
      </div>

      {linking && (
        <div className="flex gap-2 mb-4">
          <select
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-success"
          >
            <option value="">Selecione um ônibus</option>
            {availableBuses.map((bus) => (
              <option key={bus._id} value={bus._id}>
                {bus.identifier} · {bus.capacity} vagas
              </option>
            ))}
          </select>
          <button
            onClick={handleLink}
            disabled={!selectedBusId || !!loadingId}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              !selectedBusId || !!loadingId
                ? "bg-success/50 text-white cursor-not-allowed"
                : "bg-success hover:bg-success/90 text-white"
            )}
          >
            Vincular
          </button>
        </div>
      )}

      {linkedBuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-on-surface-muted">
          <Bus className="w-10 h-10 mb-2" />
          <p className="text-sm">Nenhum ônibus vinculado</p>
          {allBuses.length === 0 && (
            <p className="text-xs mt-1 text-center">
              Cadastre ônibus na página de Gerenciamento de Ônibus primeiro
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {linkedBuses.map((bus) => (
            <li
              key={bus._id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant group"
            >
              <div className="flex items-center gap-3">
                <Bus className="w-4.5 h-4.5 text-success" />
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    {bus.identifier}
                  </p>
                  <p className="text-xs text-on-surface-muted">{bus.capacity} vagas</p>
                </div>
              </div>
              <button
                onClick={() => handleUnlink(bus._id)}
                disabled={loadingId === bus._id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-on-surface-muted hover:text-error hover:bg-error-container transition-all"
                title="Desvincular"
              >
                {loadingId === bus._id
                  ? <Hourglass className="w-4 h-4" />
                  : <Unlink className="w-4 h-4" />
                }
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
