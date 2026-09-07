"use client";

import { useEffect, useState } from "react";
import type { InfoLens } from "@/types/info.types";
import type { ReadoutToken } from "@/lib/info/readout";
import { usePrefersReducedMotion } from "@/hooks/ui/useTheme";
import { cn } from "@/lib/utils";

interface ReadoutLineProps {
  tokens: ReadoutToken[];
  onApplyLens: (patch: Partial<InfoLens>) => void;
  /** Muda quando o ciclo troca — dispara o count-up de novo. */
  countUpKey: string;
}

/**
 * A frase de estado. Sem caixa, largura toda: o usuário lê a situação antes de
 * olhar qualquer gráfico. Os números são clicáveis e aplicam o recorte
 * correspondente.
 */
export function ReadoutLine({
  tokens,
  onApplyLens,
  countUpKey,
}: ReadoutLineProps) {
  return (
    // `role="status"` faz leitores de tela anunciarem a nova situação quando o
    // recorte muda, sem roubar o foco.
    <p
      role="status"
      aria-label="Situação do recorte"
      className="px-6 text-lg leading-relaxed text-on-surface-variant"
    >
      {tokens.map((token, i) => {
        if (!token.strong) {
          return <span key={i}>{token.text}</span>;
        }

        const numeric = Number(token.text.replace(/\./g, ""));
        const content = Number.isFinite(numeric) ? (
          <CountUp value={numeric} text={token.text} resetKey={countUpKey} />
        ) : (
          token.text
        );

        if (!token.lens) {
          return (
            <strong key={i} className="font-semibold tabular-nums text-on-surface">
              {content}
            </strong>
          );
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => onApplyLens(token.lens!)}
            className={cn(
              "font-semibold tabular-nums text-on-surface underline decoration-outline-variant underline-offset-4",
              "transition-colors duration-150 cursor-pointer",
              "hover:decoration-primary hover:text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
            )}
          >
            {content}
          </button>
        );
      })}
    </p>
  );
}

const COUNT_UP_MS = 500;

/**
 * Count-up dos números-âncora — só na primeira carga e ao trocar de ciclo.
 * Em nenhum outro momento: números que animam a cada filtro viram ruído.
 */
function CountUp({
  value,
  text,
  resetKey,
}: {
  value: number;
  text: string;
  resetKey: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  // O valor final é o estado de repouso: se a animação não rodar (movimento
  // reduzido, valor zero), o número correto já está na tela — nada a
  // sincronizar dentro do efeito.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reducedMotion || value === 0) return;

    let frame: number | null = null;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_MS);
      // ease-out cúbica: rápido no início, assenta no fim.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
    // `resetKey` muda só na troca de ciclo — é o gatilho intencional.
  }, [resetKey, value, reducedMotion]);

  return <>{display === value ? text : display.toLocaleString("pt-BR")}</>;
}
