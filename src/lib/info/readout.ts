import { DAY_LABELS } from "@/types/cards.types";
import type { CycleFunnel, Day, Grid, InfoLens, Period } from "@/types/info.types";
import { gridExtremes } from "./selectors";
import { formatNumber, plural } from "./format";

/**
 * Um pedaço da frase de leitura. `lens` presente = número clicável, que aplica
 * o recorte correspondente.
 */
export interface ReadoutToken {
  text: string;
  strong?: boolean;
  lens?: Partial<InfoLens>;
}

export interface BuildReadoutInput {
  lens: InfoLens;
  grid: Grid;
  funnel: CycleFunnel;
  /** Alunos ativos no sistema (censo), não no recorte. */
  studentsActive: number;
  /** Pessoas no recorte atual. */
  peopleInLens: number;
  /** Ônibus distintos no recorte. */
  busesInLens: number;
  /** Rótulos legíveis dos filtros ativos, para reescrever a frase. */
  contextLabels: string[];
}

const DAY_PHRASE: Record<Day, string> = {
  SEG: "segunda",
  TER: "terça",
  QUA: "quarta",
  QUI: "quinta",
  SEX: "sexta",
};

const PERIOD_PHRASE: Record<Period, string> = {
  "Manhã": "de manhã",
  "Tarde": "à tarde",
  "Noite": "à noite",
};

function cellPhrase(day: Day, period: Period): string {
  return `${DAY_PHRASE[day]} ${PERIOD_PHRASE[period]}`;
}

/**
 * Escreve a situação do recorte em português corrido.
 *
 * Regras: nenhum número inventado; se um dado não existe, a frase ENCURTA em
 * vez de dizer "0" ou "—"; no máximo três sentenças. O usuário lê a situação
 * antes de olhar qualquer gráfico.
 */
export function buildReadout(input: BuildReadoutInput): ReadoutToken[] {
  const {
    grid,
    funnel,
    studentsActive,
    peopleInLens,
    busesInLens,
    contextLabels,
  } = input;

  const tokens: ReadoutToken[] = [];
  const push = (text: string, strong?: boolean, lensPatch?: Partial<InfoLens>) =>
    tokens.push({ text, strong, lens: lensPatch });

  const hasContext = contextLabels.length > 0;

  // ── Sentença 1: quem está aqui ────────────────────────────────────────────
  if (hasContext) {
    push(`Em ${contextLabels.join(", ")}, `);
    push(formatNumber(peopleInLens), true);
    push(
      ` ${peopleInLens === 1 ? "aluno viaja" : "alunos viajam"} no transporte`,
    );
    if (busesInLens > 0) {
      push(" em ");
      push(plural(busesInLens, "ônibus", "ônibus"), true);
    }
    push(". ");
  } else {
    push("Neste ciclo, ");
    push(formatNumber(studentsActive), true);
    push(` ${studentsActive === 1 ? "aluno ativo" : "alunos ativos"} e `);
    push(formatNumber(funnel.licenses), true);
    push(
      ` ${funnel.licenses === 1 ? "carteirinha emitida" : "carteirinhas emitidas"}. `,
    );
  }

  // ── Sentença 2: o que está pendente ───────────────────────────────────────
  // Só entra se houver algo pendente — sem inventar zeros.
  const pendingParts: ReadoutToken[][] = [];
  if (funnel.pending > 0) {
    pendingParts.push([
      { text: formatNumber(funnel.pending), strong: true },
      {
        text: ` ${funnel.pending === 1 ? "solicitação aguarda" : "solicitações aguardam"} análise`,
      },
    ]);
  }
  if (funnel.waitlisted > 0) {
    pendingParts.push([
      { text: formatNumber(funnel.waitlisted), strong: true },
      {
        text: ` ${funnel.waitlisted === 1 ? "está" : "estão"} na lista de espera`,
      },
    ]);
  }
  if (pendingParts.length > 0 && !hasContext) {
    pendingParts.forEach((part, i) => {
      if (i > 0) push(" e ");
      part.forEach((t) => tokens.push(t));
    });
    push(". ");
  }

  // ── Sentença 3: pico e vale da semana ─────────────────────────────────────
  const { peak, valley } = gridExtremes(grid);
  if (peak) {
    push("O pico da semana é ");
    push(cellPhrase(peak.day, peak.period), true, {
      day: peak.day,
      period: peak.period,
    });
    push(", com ");
    push(formatNumber(peak.value), true, { day: peak.day, period: peak.period });
    push(` ${peak.value === 1 ? "aluno" : "alunos"}`);

    // Vale só aparece se for diferente do pico — senão a frase mente sobre
    // haver variação.
    if (valley && (valley.day !== peak.day || valley.period !== peak.period)) {
      push("; o vale é ");
      push(cellPhrase(valley.day, valley.period), true, {
        day: valley.day,
        period: valley.period,
      });
      push(", com ");
      push(formatNumber(valley.value), true, {
        day: valley.day,
        period: valley.period,
      });
    }
    push(".");
  }

  return tokens;
}

/** Rótulos dos filtros ativos, em português, para a frase de leitura. */
export function contextLabelsFromLens(
  lens: InfoLens,
  labels: {
    university?: string | null;
    course?: string | null;
    bus?: string | null;
  },
): string[] {
  const out: string[] = [];
  if (labels.university) out.push(labels.university);
  if (labels.course) out.push(labels.course);
  if (labels.bus) out.push(labels.bus);
  if (lens.shift) out.push(`turno da ${lens.shift.toLocaleLowerCase("pt-BR")}`);
  if (lens.day && lens.period) {
    out.push(cellPhrase(lens.day, lens.period));
  } else if (lens.day) {
    out.push(DAY_LABELS[lens.day].toLocaleLowerCase("pt-BR"));
  } else if (lens.period) {
    out.push(PERIOD_PHRASE[lens.period]);
  }
  return out;
}
