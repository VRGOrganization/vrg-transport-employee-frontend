"use client";

import { useEffect, useState } from "react";
import { busApi, universityApi } from "@/lib/universityApi";
import type { Bus } from "@/types/university.types";
import BusReleaseModal from "./BusReleaseModal";

interface BusSelectorPanelProps {
  value?: string | null;
  onChange?: (busId: string | null) => void;
  className?: string;
  includeAll?: boolean;
}

export default function BusSelectorPanel({
  value = null,
  onChange,
  className,
  includeAll = true,
}: BusSelectorPanelProps) {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [universitiesMap, setUniversitiesMap] = useState<Record<string, { acronym?: string; name?: string }>>({});
  const [releaseOpen, setReleaseOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await busApi.listWithQueueCounts();
        const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
        if (!cancelled) setBuses(data as Bus[]);

        // If slots contain only university IDs (strings), load universities to resolve acronyms
        const ids = new Set<string>();
        (data as Bus[]).forEach((b) => {
          const slots = (b.universitySlots ?? b.universityIds ?? []) as any[];
          slots.forEach((s) => {
            if (!s) return;
            if (s.universityId && typeof s.universityId === "string") ids.add(s.universityId);
            // legacy universityIds entries may already include acronym/name, skip
          });
        });

        if (!cancelled && ids.size > 0) {
          try {
            const all = await universityApi.list();
            const arr = Array.isArray(all) ? all : (all as any)?.data ?? [];
            const map: Record<string, { acronym?: string; name?: string }> = {};
            arr.forEach((u: any) => {
              if (u && u._id) map[u._id] = { acronym: u.acronym, name: u.name };
            });
            if (!cancelled) setUniversitiesMap(map);
          } catch (e) {
            // ignore university fetch errors silently
          }
        }
      } catch (err) {
        if (!cancelled) setError("Não foi possível carregar os ônibus");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = buses.find((b) => b._id === value) ?? null;

  return (
    <div className={`${className ?? ""} rounded-2xl border border-outline-variant bg-surface-container-lowest p-4`}>
      <div className="mb-3 text-sm text-on-surface-variant">Ônibus</div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-surface p-3 border border-outline-variant" />
          ))}
        </div>
      ) : !value ? (
        <div className="space-y-2">
          {buses.map((b) => {
            const slots = (b.universitySlots ?? b.universityIds ?? []) as any[];
            const acronyms = slots
              .map((s) => {
                if (!s) return "";
                // universitySlots: { universityId: string | { _id, name, acronym } }
                if (s.universityId) {
                  if (typeof s.universityId === "string") return universitiesMap[s.universityId]?.acronym ?? universitiesMap[s.universityId]?.name ?? "";
                  return (s.universityId.acronym ?? s.universityId.name ?? "").toString();
                }
                // universityIds entries: { _id, name, acronym }
                return (s.acronym ?? s.name ?? "").toString();
              })
              .filter(Boolean) as string[];

            const acronymsDisplay = acronyms.length > 0 ? acronyms.join(". ") : `${slots.length} universidades`;

            return (
              <button
                key={b._id}
                type="button"
                onClick={() => onChange?.(b._id)}
                className={`w-full text-left rounded-xl border p-3 bg-surface hover:border-primary transition flex items-center justify-between ${
                  value === b._id ? "border-primary bg-primary/10" : "border-outline-variant"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-on-surface">{b.identifier}</div>
                    {b.shift && (
                      <div className="text-xxs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {b.shift}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-on-surface-variant">{acronymsDisplay}</div>
                </div>

                <div className="text-xs text-on-surface-variant text-right">
                  <div>{b.pendingCount ?? 0} pendentes · {b.waitlistedCount ?? 0} fila</div>
                  <div>{b.filledSlotsTotal ?? 0} ocupados</div>
                </div>
              </button>
            );
          })}

          {error && <p className="text-sm text-error mt-2">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-on-surface-variant">Ônibus selecionado</div>
            <div className="text-base font-semibold text-on-surface flex items-center gap-2">
              <span>{selected?.identifier ?? "–"}</span>
              {selected?.shift && (
                <span className="text-xxs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {selected.shift}
                </span>
              )}
            </div>
            <div className="text-xs text-on-surface-variant">{selected ? `${selected.pendingCount ?? 0} pendentes · ${selected.waitlistedCount ?? 0} fila` : ""}</div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div>
              <button
                type="button"
                onClick={() => onChange?.(null)}
                className="rounded-md bg-surface-container-low px-3 py-2 text-sm hover:bg-surface-container transition"
              >
                Voltar
              </button>
            </div>
            {selected?.waitlistedCount > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setReleaseOpen(true)}
                  className="rounded-md bg-amber-50 px-3 py-2 text-sm hover:bg-amber-100 transition"
                >
                  Liberar vagas
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <BusReleaseModal
        open={releaseOpen}
        bus={selected}
        onClose={() => setReleaseOpen(false)}
        onSuccess={async () => {
          try {
            const res = await busApi.listWithQueueCounts();
            const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
            setBuses(data as Bus[]);
          } catch (e) {
            // ignore
          }
        }}
      />
    </div>
  );
}
