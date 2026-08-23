"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { DownloadFormatMenu } from "@/components/audit/DownloadFormatMenu";
import type { AuditDownloadFormat } from "@/lib/auditDownload";
import type { CycleSummary, InfoLens, InfoMetric } from "@/types/info.types";
import { formatClock } from "@/lib/info/format";
import { CycleSelector } from "./CycleSelector";
import { FilterPopover, type FilterOption } from "./FilterPopover";

interface CommandBarProps {
  lens: InfoLens;
  onPatchLens: (patch: Partial<InfoLens>) => void;
  cycles: CycleSummary[];
  universityOptions: FilterOption[];
  courseOptions: FilterOption[];
  busOptions: FilterOption[];
  shiftOptions: FilterOption[];
  generatedAt: string | null;
  loading: boolean;
  onRefresh: () => void;
  onDownload: (format: AuditDownloadFormat) => void;
  downloadDisabled: boolean;
}

const METRIC_TABS: Array<{ key: InfoMetric; label: string }> = [
  { key: "pessoas", label: "Pessoas" },
  { key: "pernas", label: "Pernas" },
];

/**
 * Barra de comando: tudo que muda o recorte mora aqui, na mesma faixa. O
 * seletor de ciclo fica à esquerda, na posição de maior destaque.
 */
export function CommandBar({
  lens,
  onPatchLens,
  cycles,
  universityOptions,
  courseOptions,
  busOptions,
  shiftOptions,
  generatedAt,
  loading,
  onRefresh,
  onDownload,
  downloadDisabled,
}: CommandBarProps) {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-outline-variant bg-surface/85 px-6 backdrop-blur-sm">
      <CycleSelector
        cycles={cycles}
        value={lens.cycleId}
        readAt={generatedAt}
        onChange={(cycleId) =>
          // Trocar de ciclo repinta a página inteira, mas preserva a métrica.
          onPatchLens({
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

      <div className="h-5 w-px shrink-0 bg-outline-variant" aria-hidden="true" />

      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
        <FilterPopover
          name="Faculdade"
          value={lens.universityId}
          options={universityOptions}
          emptyLabel="Todas"
          searchPlaceholder="Buscar faculdade…"
          onChange={(next) =>
            // Trocar de faculdade invalida o curso escolhido.
            onPatchLens({ universityId: next, courseKey: null })
          }
        />
        <FilterPopover
          name="Curso"
          value={lens.courseKey}
          options={courseOptions}
          emptyLabel="Todos"
          searchPlaceholder="Buscar curso…"
          disabled={!lens.universityId}
          disabledHint="Escolha uma faculdade primeiro"
          onChange={(next) => onPatchLens({ courseKey: next })}
        />
        <FilterPopover
          name="Ônibus"
          value={lens.busId}
          options={busOptions}
          emptyLabel="Todos"
          searchPlaceholder="Buscar ônibus…"
          onChange={(next) => onPatchLens({ busId: next })}
        />
        <FilterPopover
          name="Turno"
          value={lens.shift}
          options={shiftOptions}
          emptyLabel="Todos"
          searchPlaceholder="Buscar turno…"
          onChange={(next) =>
            onPatchLens({ shift: (next as InfoLens["shift"]) ?? null })
          }
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1">
          <div
            role="tablist"
            aria-label="Métrica"
            className="flex items-center gap-0.5 rounded-lg bg-surface-container-high p-0.5"
          >
            {METRIC_TABS.map((tab) => {
              const active = lens.metric === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onPatchLens({ metric: tab.key })}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    active
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <InfoTooltip
            ariaLabel="O que são pernas"
            content="Pernas conta ida e volta separadamente; um aluno que só volta de ônibus ocupa uma perna."
          />
        </div>

        {generatedAt && (
          <span className="hidden text-xs tabular-nums text-on-surface-muted lg:inline">
            Lido às {formatClock(generatedAt)}
          </span>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Atualizar dados"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-lg border border-outline-variant",
            "text-on-surface-variant transition-colors duration-150 cursor-pointer",
            "hover:border-outline hover:text-on-surface",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </button>

        <DownloadFormatMenu onPick={onDownload} disabled={downloadDisabled} />
      </div>
    </div>
  );
}
