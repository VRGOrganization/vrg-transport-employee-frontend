"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CycleSummary } from "@/types/info.types";
import { formatDateBR } from "@/lib/info/format";

interface CycleSelectorProps {
  cycles: CycleSummary[];
  value: string | null;
  onChange: (cycleId: string) => void;
  /**
   * Momento da leitura dos dados (ISO). Fecha a barra do ciclo que ainda não
   * terminou. Vem do snapshot em vez do relógio para a largura não mudar
   * sozinha entre repinturas.
   */
  readAt: string | null;
}

const STATUS_DOT: Record<CycleSummary["status"], string> = {
  active: "bg-success",
  scheduled: "bg-warning",
  closed: "bg-outline",
};

const STATUS_LABEL: Record<CycleSummary["status"], string> = {
  active: "Ativo",
  scheduled: "Agendado",
  closed: "Encerrado",
};

/**
 * Seletor de ciclo com linha do tempo. Fica na posição de maior destaque
 * (extrema esquerda) porque é o mecanismo de ver períodos anteriores — a
 * página não é só "agora".
 */
export function CycleSelector({
  cycles,
  value,
  onChange,
  readAt,
}: CycleSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = cycles.find((c) => c.cycleId === value) ?? cycles[0] ?? null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Escala compartilhada da linha do tempo: barras proporcionais à duração
  // real de cada ciclo, para o desenho não mentir sobre o tempo.
  //
  // Um ciclo sem `endDate` (janela ainda aberta) é medido até o momento da
  // leitura dos dados — não até o relógio de agora, que mudaria a largura a
  // cada repintura.
  const { spans, maxSpan, maxLicenses } = useMemo(() => {
    const now = readAt ? Date.parse(readAt) : 0;
    const measured = cycles.map((cycle) => {
      const start = Date.parse(cycle.cycleStartDate);
      const end = cycle.endDate ? Date.parse(cycle.endDate) : now;
      return Number.isFinite(start) && Number.isFinite(end) && end > start
        ? end - start
        : 0;
    });
    return {
      spans: measured,
      maxSpan: Math.max(...measured, 1),
      maxLicenses: Math.max(...cycles.map((c) => c.licenses), 1),
    };
  }, [cycles, readAt]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-outline-variant",
          "bg-surface-container-lowest px-2.5 text-sm text-on-surface",
          "transition-colors duration-150 cursor-pointer hover:border-outline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
      >
        <CalendarRange className="size-4 shrink-0 text-on-surface-muted" aria-hidden="true" />
        <span className="text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
          Ciclo
        </span>
        {selected ? (
          <>
            <span
              className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[selected.status])}
              aria-hidden="true"
            />
            <span className="font-medium tabular-nums">
              {formatDateBR(selected.cycleStartDate)} → {formatDateBR(selected.endDate)}
            </span>
            <span className="sr-only">{STATUS_LABEL[selected.status]}</span>
          </>
        ) : (
          <span className="text-on-surface-muted">Nenhum ciclo</span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-on-surface-muted transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Ciclos de inscrição"
          className="absolute left-0 top-full z-40 mt-1 w-96 rounded-xl border border-outline-variant bg-surface-container-lowest p-1.5"
          style={{ boxShadow: "var(--shadow-modal)" }}
        >
          <p className="px-2 pb-1.5 text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
            Linha do tempo · {cycles.length} ciclo{cycles.length === 1 ? "" : "s"}
          </p>

          <div className="max-h-80 overflow-y-auto">
            {cycles.map((cycle, i) => {
              const isSelected = cycle.cycleId === selected?.cycleId;
              const width = Math.max(6, (spans[i] / maxSpan) * 100);

              return (
                <button
                  key={cycle.cycleId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(cycle.cycleId);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-left",
                    "transition-colors duration-150 cursor-pointer",
                    isSelected
                      ? "bg-primary/10"
                      : "hover:bg-surface-container-high",
                  )}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[cycle.status])}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "tabular-nums",
                        isSelected ? "font-semibold text-on-surface" : "text-on-surface-variant",
                      )}
                    >
                      {formatDateBR(cycle.cycleStartDate)} → {formatDateBR(cycle.endDate)}
                    </span>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-on-surface-variant">
                      {cycle.licenses.toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Barra proporcional à duração do ciclo. */}
                    <div className="h-1 flex-1 rounded-full bg-surface-container-high">
                      <div
                        className={cn(
                          "info-bar h-full rounded-full",
                          isSelected ? "bg-primary" : "bg-outline",
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-[10px] uppercase tracking-wide text-on-surface-muted">
                      {STATUS_LABEL[cycle.status]}
                    </span>
                  </div>

                  {/* Carteirinhas emitidas, na mesma escala entre ciclos. */}
                  <div className="h-0.5 w-full rounded-full bg-surface-container-high">
                    <div
                      className="info-bar h-full rounded-full bg-secondary"
                      style={{ width: `${(cycle.licenses / maxLicenses) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}

            {cycles.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-on-surface-muted">
                Nenhum ciclo de inscrição registrado.
              </p>
            )}
          </div>

          <p className="border-t border-outline-variant px-2 pt-1.5 text-[11px] text-on-surface-muted">
            Barra superior: duração do ciclo. Inferior: carteirinhas emitidas.
          </p>
        </div>
      )}
    </div>
  );
}
