"use client";

import { cn } from "@/lib/utils";
import type { CycleFunnel, CycleSummary } from "@/types/info.types";
import { daysUntil, formatDateBR, formatNumber, formatPercent } from "@/lib/info/format";
import { CycleHistoryChart } from "./CycleHistoryChart";

interface CyclePanelProps {
  cycles: CycleSummary[];
  selected: CycleSummary | null;
  funnel: CycleFunnel;
  /** Momento da leitura — base do "fecha em N dias", sem ler o relógio. */
  readAt: string | null;
  onSelectCycle: (cycleId: string) => void;
}

export function CyclePanel({
  cycles,
  selected,
  funnel,
  readAt,
  onSelectCycle,
}: CyclePanelProps) {
  return (
    <section
      aria-labelledby="info-ciclo"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
    >
      <h2 id="info-ciclo" className="mb-2 text-sm font-semibold text-on-surface">
        Ciclo
      </h2>

      <WindowBlock cycle={selected} readAt={readAt} />

      <div className="my-3 border-t border-outline-variant pt-3">
        <FunnelBlock funnel={funnel} />
      </div>

      <div className="border-t border-outline-variant pt-3">
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-muted">
          Carteirinhas por ciclo
        </h3>
        <CycleHistoryChart
          cycles={cycles}
          selectedCycleId={selected?.cycleId ?? null}
          onSelectCycle={onSelectCycle}
        />
      </div>
    </section>
  );
}

/**
 * Janela de inscrição. `startDate`/`endDate` são da JANELA (podem vir nulos);
 * `cycleStartDate` é o início real do ciclo.
 */
function WindowBlock({
  cycle,
  readAt,
}: {
  cycle: CycleSummary | null;
  readAt: string | null;
}) {
  if (!cycle) {
    return (
      <p className="text-sm text-on-surface-muted">Nenhum ciclo selecionado.</p>
    );
  }

  const hasWindow = Boolean(cycle.startDate && cycle.endDate);
  const remaining = hasWindow ? daysUntil(cycle.endDate) : null;

  // Progresso da janela: quanto já passou entre início e fim.
  let progress = 0;
  if (hasWindow && readAt) {
    const start = Date.parse(cycle.startDate!);
    const end = Date.parse(cycle.endDate!);
    const now = Date.parse(readAt);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm text-on-surface">
        {hasWindow ? (
          <>
            Janela de inscrição aberta
            {remaining !== null && remaining >= 0 && (
              <span className="text-on-surface-variant">
                {" · "}
                fecha em {formatNumber(remaining)}{" "}
                {remaining === 1 ? "dia" : "dias"}
              </span>
            )}
          </>
        ) : (
          <>
            Janela fechada
            {cycle.endDate && (
              <span className="text-on-surface-variant">
                {" · "}
                desde {formatDateBR(cycle.endDate)}
              </span>
            )}
          </>
        )}
      </p>

      {hasWindow && (
        <>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="info-bar h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 flex justify-between text-[11px] tabular-nums text-on-surface-muted">
            <span>{formatDateBR(cycle.startDate)}</span>
            <span>{formatDateBR(cycle.endDate)}</span>
          </p>
        </>
      )}

      {cycle.resetScheduledFor && (
        // É a data que faz as carteirinhas expirarem — precisa estar visível.
        <p className="mt-1.5 text-[11px] text-on-surface-variant">
          Reset do ciclo em{" "}
          <span className="tabular-nums">
            {formatDateBR(cycle.resetScheduledFor)}
          </span>
        </p>
      )}
    </div>
  );
}

/** Funil em barras honestas: sem forma de funil desenhada, sem ícone. */
function FunnelBlock({ funnel }: { funnel: CycleFunnel }) {
  const max = Math.max(funnel.requests, 1);

  const steps = [
    { label: "Solicitações recebidas", value: funnel.requests, previous: null },
    { label: "Aprovadas", value: funnel.approved, previous: funnel.requests },
    { label: "Carteirinhas emitidas", value: funnel.licenses, previous: funnel.approved },
  ];

  return (
    <div>
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-muted">
        Funil do ciclo
      </h3>

      <ul className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="text-on-surface-variant">{step.label}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="tabular-nums text-on-surface">
                  {formatNumber(step.value)}
                </span>
                {step.previous !== null && step.previous > 0 && (
                  <span className="text-[11px] tabular-nums text-on-surface-muted">
                    {formatPercent(step.value, step.previous)}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-sm bg-surface-container-low">
              <div
                className="info-bar h-full rounded-sm bg-primary"
                style={{ width: `${(step.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}

        {/* Lista de espera fica FORA da cascata: não é uma etapa do funil,
            é um desvio dele. */}
        <li className="pt-0.5">
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="text-on-surface-variant">Em lista de espera</span>
            <span className="tabular-nums text-on-surface">
              {formatNumber(funnel.waitlisted)}
            </span>
          </div>
          <div className="mt-0.5 flex h-1.5 w-full justify-end overflow-hidden rounded-sm bg-surface-container-low">
            <div
              className="info-bar h-full rounded-sm bg-warning"
              style={{ width: `${(funnel.waitlisted / max) * 100}%` }}
            />
          </div>
        </li>
      </ul>

      {(funnel.pending > 0 ||
        funnel.revisionPendingStudent > 0 ||
        funnel.revisionResubmitted > 0) && (
        <ul className="mt-2 space-y-0.5 border-t border-outline-variant pt-2 text-[11px]">
          <FunnelNote label="Aguardando análise" value={funnel.pending} />
          <FunnelNote
            label="Revisão · aguardando aluno"
            value={funnel.revisionPendingStudent}
          />
          <FunnelNote
            label="Revisão · aguardando funcionário"
            value={funnel.revisionResubmitted}
          />
        </ul>
      )}
    </div>
  );
}

function FunnelNote({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <li className={cn("flex justify-between gap-2 text-on-surface-muted")}>
      <span>{label}</span>
      <span className="tabular-nums text-on-surface-variant">
        {formatNumber(value)}
      </span>
    </li>
  );
}
