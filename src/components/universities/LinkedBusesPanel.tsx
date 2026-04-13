"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Bus, University } from "@/types/university.types";
import { busApi } from "@/lib/universityApi";

interface Props {
  university: University;
  allBuses: Bus[];
  onBusesChanged: () => void;
}

export function LinkedBusesPanel({ university, allBuses, onBusesChanged }: Props) {
  const [linking, setLinking] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const linkedBuses = allBuses.filter((bus) =>
    bus.universityIds.some((u) =>
      typeof u === "string" ? u === university._id : u._id === university._id
    )
  );

  const availableBuses = allBuses.filter(
    (bus) => !bus.universityIds.some((u) =>
      typeof u === "string" ? u === university._id : u._id === university._id
    )
  );

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
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Ônibus vinculados ({linkedBuses.length})
        </h3>
        {availableBuses.length > 0 && (
          <button
            onClick={() => setLinking((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              {linking ? "close" : "add"}
            </span>
            {linking ? "Cancelar" : "Vincular ônibus"}
          </button>
        )}
      </div>

      {linking && (
        <div className="flex gap-2 mb-4">
          <select
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                ? "bg-emerald-200 text-white cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            Vincular
          </button>
        </div>
      )}

      {linkedBuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2">directions_bus</span>
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
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: "18px" }}>
                  directions_bus
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {bus.identifier}
                  </p>
                  <p className="text-xs text-slate-400">{bus.capacity} vagas</p>
                </div>
              </div>
              <button
                onClick={() => handleUnlink(bus._id)}
                disabled={loadingId === bus._id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Desvincular"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {loadingId === bus._id ? "hourglass_empty" : "link_off"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}