import { DAYS, PERIODS } from "@/types/info.types";
import { DAY_LABELS } from "@/types/cards.types";

/**
 * Esqueleto ESTRUTURAL: a grade aparece com suas 15 células e cabeçalhos
 * reais, a frota com trilhos vazios. O usuário entende o layout antes de o
 * dado chegar — diferente de blocos cinza genéricos, que não informam nada.
 */
export function ControlRoomSkeleton() {
  return (
    <div className="px-6 py-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando informações do sistema…</span>

      <div className="info-skeleton mb-5 h-6 w-2/3 rounded bg-surface-container-high" />

      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 lg:col-span-8">
          <div className="mb-3 flex gap-2">
            <div className="w-16 shrink-0" />
            {DAYS.map((day) => (
              <div key={day} className="flex-1 text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
                {DAY_LABELS[day]}
              </div>
            ))}
          </div>
          {PERIODS.map((period) => (
            <div key={period} className="mb-2 flex items-center gap-2">
              <div className="w-16 shrink-0 text-[11px] uppercase tracking-[0.08em] text-on-surface-muted">
                {period}
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="info-skeleton h-[92px] flex-1 rounded-lg bg-surface-container-low"
                />
              ))}
            </div>
          ))}
        </section>

        <div className="col-span-12 space-y-4 lg:col-span-4">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="info-skeleton mb-2 h-5 rounded bg-surface-container-high"
              />
            ))}
          </section>
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="info-skeleton mb-2 h-5 rounded bg-surface-container-high"
              />
            ))}
          </section>
        </div>

        <section className="col-span-12 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="info-skeleton mb-2 h-11 rounded-lg bg-surface-container-low"
            />
          ))}
        </section>
      </div>
    </div>
  );
}
