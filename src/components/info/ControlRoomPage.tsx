"use client";

import { useMemo, useState } from "react";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import { useInfoSnapshot } from "@/hooks/data/useInfoSnapshot";
import { useInfoLens } from "@/hooks/ui/useInfoLens";
import { useIsDark } from "@/hooks/ui/useTheme";
import { createBusPalette } from "@/lib/info/palette";
import { downloadInfo } from "@/lib/info/export";
import { toast } from "@/lib/toast";
import type { AuditDownloadFormat } from "@/lib/auditDownload";
import { BusRosterDrawer } from "./BusRosterDrawer";
import { CensusStrip } from "./CensusStrip";
import { CommandBar } from "./CommandBar";
import { ControlRoomSkeleton } from "./ControlRoomSkeleton";
import { CyclePanel } from "./CyclePanel";
import { DayOverlapMatrix } from "./DayOverlapMatrix";
import { FleetRails } from "./FleetRails";
import { FrequencyProfile } from "./FrequencyProfile";
import { InstitutionsPanel } from "./InstitutionsPanel";
import { LensChips } from "./LensChips";
import { ReadoutLine } from "./ReadoutLine";
import { WeekGrid } from "./WeekGrid";
import { useControlRoomView } from "./useControlRoomView";

/**
 * Orquestrador da sala de controle. Não faz conta de negócio: monta a lente,
 * pede a visão derivada e distribui por props. Toda agregação vive em
 * `lib/info/selectors`, todo fetch em `services/infoService`.
 */
export function ControlRoomPage() {
  const { snapshot, loading, error, refetch } = useInfoSnapshot();

  const courseLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const course of snapshot?.courses ?? []) {
      map.set(
        course.name
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLocaleLowerCase("pt-BR")
          .replace(/\s+/g, " ")
          .trim(),
        course.name,
      );
    }
    return map;
  }, [snapshot?.courses]);

  const { lens, patchLens, clearLens, chips } = useInfoLens({
    universities: snapshot?.universities ?? [],
    buses: snapshot?.buses ?? [],
    courseLabels,
  });

  const view = useControlRoomView(snapshot, lens);

  const isDark = useIsDark();
  // Rampa de cores estável: o mesmo ônibus tem a mesma cor entre painéis,
  // recargas e sessões — sem isso a barra de composição da grade é ilegível.
  const palette = useMemo(
    () => createBusPalette(snapshot?.buses ?? [], isDark),
    [snapshot?.buses, isDark],
  );

  const universityNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const uni of snapshot?.universities ?? []) {
      map.set(uni._id, uni.acronym || uni.name);
    }
    return map;
  }, [snapshot?.universities]);

  const [roster, setRoster] = useState<{ busId: string; identifier: string } | null>(
    null,
  );

  /** Exporta exatamente o recorte que está na tela, nos três formatos. */
  function handleDownload(format: AuditDownloadFormat) {
    if (!snapshot) return;
    void downloadInfo(
      format,
      {
        lens: view.effectiveLens,
        cycle: view.selectedCycle,
        filterLabels: chips.map((chip) => chip.label),
        grid: view.grid,
        totals: view.totals,
        frequency: view.frequency,
        fleet: view.fleet,
        institutions: view.institutions,
        funnel: view.funnel,
        census: view.census,
        cycles: view.cycles,
        generatedAt: snapshot.generatedAt,
      },
      view.readout.map((token) => token.text).join(""),
    ).catch(() => {
      toast.error("Não foi possível gerar o arquivo.");
    });
  }

  if (loading && !snapshot) {
    return (
      <main className="flex-1">
        <ControlRoomSkeleton />
      </main>
    );
  }

  if (error && !snapshot) {
    return (
      <main className="flex-1 p-6">
        <ErrorState message={error} onRetry={refetch} />
      </main>
    );
  }

  return (
    <main className="flex-1">
      <CommandBar
        lens={view.effectiveLens}
        onPatchLens={patchLens}
        cycles={view.cycles}
        universityOptions={view.universityOptions}
        courseOptions={view.courseOptions}
        busOptions={view.busOptions}
        shiftOptions={view.shiftOptions}
        generatedAt={snapshot?.generatedAt ?? null}
        loading={loading}
        onRefresh={refetch}
        onDownload={handleDownload}
        downloadDisabled={!snapshot}
      />

      <LensChips
        chips={chips}
        onRemove={(key) => patchLens({ [key]: null })}
        onClear={clearLens}
      />

      <div className="pt-3">
        <ReadoutLine
          tokens={view.readout}
          onApplyLens={patchLens}
          countUpKey={view.effectiveLens.cycleId ?? "sem-ciclo"}
        />
      </div>

      {view.failures.length > 0 && (
        <p className="mx-6 mt-3 rounded-lg border border-warning-border bg-warning-container px-3 py-2 text-xs text-on-warning">
          Não foi possível carregar: {view.failures.join(", ")}. O restante da
          página segue com os dados disponíveis.
        </p>
      )}

      <div className="grid grid-cols-12 gap-4 px-6 py-5">
        <div className="col-span-12 lg:col-span-8">
          {view.cycleIsEmpty ? (
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <EmptyState
                title="Este ciclo não registrou solicitações"
                description="Nenhum pedido de carteirinha foi feito no período selecionado."
              />
            </section>
          ) : view.lensIsEmpty ? (
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <EmptyState
                title="Nenhum aluno neste recorte"
                description="Os filtros ativos não retornaram nenhuma viagem."
                action={
                  <Button variant="outline" size="sm" onClick={clearLens}>
                    Limpar recorte
                  </Button>
                }
              />
            </section>
          ) : (
            <div className="info-panel-enter space-y-4">
              <WeekGrid
                grid={view.grid}
                totals={view.totals}
                lens={view.effectiveLens}
                palette={palette}
                capacityByBusDay={view.capacityByBusDay}
                onPatchLens={patchLens}
              />

              <section
                className="info-panel-enter rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                style={{ "--info-delay": "40ms" } as React.CSSProperties}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:divide-x md:divide-outline-variant">
                  <FrequencyProfile buckets={view.frequency} />
                  <div className="md:pl-4">
                    <DayOverlapMatrix matrix={view.overlap} />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Coluna direita: censo em cima, ciclo embaixo. */}
        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div
            className="info-panel-enter"
            style={{ "--info-delay": "40ms" } as React.CSSProperties}
          >
            <CensusStrip census={view.census} />
          </div>
          <div
            className="info-panel-enter"
            style={{ "--info-delay": "80ms" } as React.CSSProperties}
          >
            <CyclePanel
              cycles={view.cycles}
              selected={view.selectedCycle}
              funnel={view.funnel}
              readAt={snapshot?.generatedAt ?? null}
              onSelectCycle={(cycleId) =>
                patchLens({
                  cycleId,
                  universityId: null,
                  courseKey: null,
                  busId: null,
                  shift: null,
                  day: null,
                  period: null,
                })
              }
            />
          </div>
        </div>

        {!view.cycleIsEmpty && !view.lensIsEmpty && (
          <div
            className="info-panel-enter col-span-12"
            style={{ "--info-delay": "120ms" } as React.CSSProperties}
          >
            <FleetRails
              fleet={view.fleet}
              palette={palette}
              lens={view.effectiveLens}
              universityNames={universityNames}
              capacityByBusDay={view.capacityByBusDay}
              busesActive={snapshot?.buses.length ?? 0}
              busesInactive={snapshot?.busesInactive ?? 0}
              studentsTransported={view.totals.total}
              dualEnrollment={view.institutions.alunosComDuplaMatricula}
              onPatchLens={patchLens}
              onOpenRoster={(busId, identifier) =>
                setRoster({ busId, identifier })
              }
            />
          </div>
        )}

        {!view.cycleIsEmpty && !view.lensIsEmpty && (
          <div
            className="info-panel-enter col-span-12"
            style={{ "--info-delay": "160ms" } as React.CSSProperties}
          >
            <InstitutionsPanel
              view={view.institutions}
              lens={view.effectiveLens}
              onPatchLens={patchLens}
            />
          </div>
        )}
      </div>

      <BusRosterDrawer
        open={roster !== null}
        busId={roster?.busId ?? null}
        busIdentifier={roster?.identifier ?? null}
        cycleId={view.effectiveLens.cycleId}
        bus={snapshot?.buses.find((b) => b._id === roster?.busId) ?? null}
        universityNames={universityNames}
        onClose={() => setRoster(null)}
      />
    </main>
  );
}
