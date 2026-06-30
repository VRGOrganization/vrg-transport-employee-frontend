"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { PanelCard } from "@/components/ui/PanelCard";
import { universityService } from "@/services/universityService";
import type { University } from "@/types/university.types";

interface UniversitySelectorPanelProps {
  value?: string | null;
  onChange?: (universityId: string | null) => void;
  className?: string;
}

export default function UniversitySelectorPanel({
  value = null,
  onChange,
  className,
}: UniversitySelectorPanelProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const mountState = { cancelled: false };

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await universityService.listWithQueueCounts();
        if (!mountState.cancelled) {
          setUniversities(data.filter((university) => university.active));
        }
      } catch {
        if (!mountState.cancelled) {
          setError("Não foi possível carregar as universidades");
        }
      } finally {
        if (!mountState.cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      mountState.cancelled = true;
    };
  }, []);

  const selected = universities.find((university) => university._id === value) ?? null;

  return (
    <PanelCard as="div" className={className}>
      <div className="mb-3 text-sm text-on-surface-variant">Universidade</div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl border border-outline-variant bg-surface p-3" />
          ))}
        </div>
      ) : !value ? (
        <div className="space-y-2">
          {universities.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <GraduationCap className="size-10 text-on-surface-variant/30" />
              <p className="text-sm font-medium text-on-surface-variant">
                Nenhuma universidade cadastrada
              </p>
              <p className="text-xs text-on-surface-muted">
                Cadastre universidades para revisar carteirinhas.
              </p>
            </div>
          )}

          {universities.map((university) => (
            <button
              key={university._id}
              type="button"
              onClick={() => onChange?.(university._id)}
              className={`w-full cursor-pointer rounded-xl border bg-surface p-3 text-left transition hover:border-primary hover:bg-surface-container-low ${
                value === university._id ? "border-primary bg-primary/10" : "border-outline-variant"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-on-surface">
                    {university.acronym}
                  </div>
                  <div className="truncate text-xs text-on-surface-variant">
                    {university.name}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(university.pendingCount ?? 0) > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {university.pendingCount} pendentes
                    </span>
                  )}
                  {(university.waitlistedCount ?? 0) > 0 && (
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                      {university.waitlistedCount} em fila
                    </span>
                  )}
                  {(university.revisionCount ?? 0) > 0 && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                      {university.revisionCount} em revisão
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}

          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-on-surface-variant">Universidade selecionada</div>
            <div className="truncate text-base font-semibold text-on-surface">
              {selected?.acronym ?? "–"}
            </div>
            <div className="truncate text-xs text-on-surface-variant">
              {selected?.name ?? ""}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange?.(null)}
            className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant transition hover:bg-surface-container-high"
          >
            Trocar
          </button>
        </div>
      )}
    </PanelCard>
  );
}
