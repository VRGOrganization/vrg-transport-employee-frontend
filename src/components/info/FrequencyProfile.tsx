"use client";

import type { FrequencyBucket } from "@/types/info.types";
import { formatNumber, formatPercent } from "@/lib/info/format";

interface FrequencyProfileProps {
  buckets: FrequencyBucket[];
}

/**
 * Cinco barras: quantos alunos viajam em 1, 2, … 5 dias distintos da semana.
 *
 * É a tradução visual de "as vagas são dinâmicas" — mostra que a população não
 * é um bloco fixo de 5 dias, e sim uma mistura de frequências.
 */
export function FrequencyProfile({ buckets }: FrequencyProfileProps) {
  const total = buckets.reduce((sum, b) => sum + b.students, 0);
  const max = Math.max(...buckets.map((b) => b.students), 1);

  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-muted">
        Frequência semanal
      </h3>

      <ul className="space-y-1">
        {buckets.map((bucket) => (
          <li key={bucket.days} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-on-surface-variant">
              {bucket.days} {bucket.days === 1 ? "dia" : "dias"}
            </span>
            <span className="h-3 flex-1 overflow-hidden rounded-sm bg-surface-container-low">
              <span
                className="info-bar block h-full rounded-sm bg-primary"
                style={{ width: `${(bucket.students / max) * 100}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-on-surface">
              {formatNumber(bucket.students)}
            </span>
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-on-surface-muted">
              {formatPercent(bucket.students, total)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] leading-snug text-on-surface-muted">
        Cada aluno entra em um único grupo, pelo número de dias distintos em que
        viaja na semana.
      </p>
    </div>
  );
}
