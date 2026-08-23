"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { BanHistoryEntry, BanHistoryEvent } from "@/types/banlist";

interface BanHistoryModalProps {
  open: boolean;
  studentName: string;
  history: BanHistoryEntry[];
  loading?: boolean;
  error?: string;
  onClose: () => void;
}

/** "22 de ago. de 2026 às 14:30" — data e hora, como o histórico exige. */
function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_STYLE = {
  ban: {
    label: "Banido",
    dot: "bg-error text-white border-error",
    chip: "bg-error/10 text-error border-error/25",
    reason: "bg-error/5 border-error/15",
    reasonsLabel: "Motivo do banimento",
    Icon: ShieldAlert,
  },
  unban: {
    label: "Reativado",
    dot: "bg-success text-white border-success",
    chip: "bg-success/10 text-success border-success/25",
    reason: "bg-success/5 border-success/15",
    reasonsLabel: "Motivo da reativação",
    Icon: ShieldCheck,
  },
} as const;

/** Um nó da árvore: bolinha + linha vertical, no estilo de um log de git. */
function TimelineNode({
  event,
  isLast,
}: {
  event: BanHistoryEvent;
  isLast: boolean;
}) {
  const style = EVENT_STYLE[event.type];
  const { Icon } = style;
  const reasons = event.reasons.filter((r) => r.trim());

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {/* Trilho vertical ligando este nó ao próximo */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-3 top-7 bottom-0 w-px bg-outline-variant/50"
        />
      )}

      <span
        className={`relative z-10 size-6 shrink-0 rounded-full border-2 flex items-center justify-center ${style.dot}`}
      >
        <Icon className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1 -mt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${style.chip}`}
          >
            {style.label}
          </span>
          <time className="text-xs text-on-surface-variant" dateTime={event.at}>
            {formatDateTime(event.at)}
          </time>
        </div>

        <p className="mt-1.5 text-sm text-on-surface">
          <span className="text-on-surface-variant">
            {event.type === "ban" ? "Banido por " : "Reativado por "}
          </span>
          <span className="font-semibold">
            {event.byName ?? "Usuário removido do sistema"}
          </span>
        </p>

        {reasons.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              {style.reasonsLabel}
              {reasons.length > 1 ? "s" : ""}
            </p>
            {reasons.map((reason, i) => (
              <p
                key={i}
                className={`text-sm text-on-surface-variant rounded-lg border px-3 py-2 ${style.reason}`}
              >
                {reason}
              </p>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Histórico de banimentos do aluno como uma linha do tempo cronológica, no
 * formato de árvore de versionamento: cada ciclo de banimento vira um ramo com
 * os eventos "Banido" e, quando houve, "Reativado".
 */
export function BanHistoryModal({
  open,
  studentName,
  history,
  loading = false,
  error,
  onClose,
}: BanHistoryModalProps) {
  // Do mais recente para o mais antigo: o que importa primeiro é o estado atual.
  const cycles = [...history].reverse();

  return (
    <Modal open={open} onClose={onClose} title="Histórico de banimentos" size="lg">
      <p className="text-sm text-on-surface-variant mb-5">
        Linha do tempo de banimentos e reativações de{" "}
        <strong className="text-on-surface">{studentName}</strong>.
      </p>

      {loading && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-surface-container-high animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {!loading && !error && cycles.length === 0 && (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-6 text-center text-sm text-on-surface-variant">
          Este aluno nunca foi banido.
        </p>
      )}

      {!loading && !error && cycles.length > 0 && (
        <div className="space-y-4">
          {cycles.map((cycle, index) => {
            // Numeração cronológica real: o 1º banimento é o mais antigo.
            const cycleNumber = cycles.length - index;
            // Dentro do ciclo, do mais recente para o mais antigo, para a
            // leitura seguir a mesma direção da lista de ciclos.
            const events = [...cycle.events].reverse();

            return (
              <section
                key={cycle.banId}
                className="rounded-xl border border-outline-variant/60 overflow-hidden"
              >
                <header className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {cycleNumber}º banimento
                  </span>
                  <span
                    className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      cycle.active
                        ? "bg-error/10 text-error border-error/25"
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant/40"
                    }`}
                  >
                    {cycle.active ? "Em vigor" : "Encerrado"}
                  </span>
                </header>

                <ol className="px-4 py-4">
                  {events.map((event, i) => (
                    <TimelineNode
                      key={`${event.type}-${event.at}`}
                      event={event}
                      isLast={i === events.length - 1}
                    />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
