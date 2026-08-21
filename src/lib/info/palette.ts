import { UNKNOWN_BUS_KEY, type Period } from "@/types/info.types";
import { compareIdentifiers } from "./normalize";

/**
 * Turno tem cor FIXA e semântica, derivada dos tokens da marca. Nunca é
 * decorativa: quem lê a grade aprende a associar a cor à faixa do dia.
 */
export const PERIOD_COLOR_VAR: Record<Period, string> = {
  "Manhã": "var(--color-warning)",
  "Tarde": "var(--color-secondary)",
  "Noite": "var(--color-primary)",
};

/** Ângulo áureo: espalha matizes sem repetir cedo, para qualquer quantidade. */
const GOLDEN_ANGLE = 137.5;

/** Saturação/luminosidade por tema — mantém contraste legível nos dois. */
const RAMP = {
  light: { s: 55, l: 45 },
  dark: { s: 60, l: 62 },
} as const;

export interface BusPalette {
  /** Cor do ônibus no tema atual. */
  color: (busId: string | null) => string;
  /** Cor de texto legível sobre a cor do ônibus. */
  readableOn: (busId: string | null) => string;
  /** Índice ordinal estável do ônibus na rampa. */
  index: (busId: string | null) => number;
}

/**
 * Constrói a rampa ordinal de ônibus.
 *
 * O índice vem da ordenação por `identifier` — não da ordem de chegada dos
 * dados —, então o mesmo ônibus recebe a mesma cor entre painéis, entre
 * recargas e entre sessões. Isso é requisito de leitura: a barrinha de
 * composição da grade só é interpretável se a cor for constante.
 */
export function createBusPalette(
  buses: Array<{ _id: string; identifier: string }>,
  isDark: boolean,
): BusPalette {
  const ordered = [...buses].sort((a, b) =>
    compareIdentifiers(a.identifier ?? "", b.identifier ?? ""),
  );
  const indexById = new Map(ordered.map((bus, i) => [bus._id, i]));
  const { s, l } = isDark ? RAMP.dark : RAMP.light;

  const index = (busId: string | null): number =>
    busId ? (indexById.get(busId) ?? -1) : -1;

  const color = (busId: string | null): string => {
    const i = index(busId);
    // Ônibus não identificado é cinza: não é uma cor da rampa, é ausência de
    // dado, e precisa parecer diferente de um ônibus real.
    if (i < 0) return "var(--color-outline)";
    const hue = (i * GOLDEN_ANGLE) % 360;
    return `hsl(${hue.toFixed(1)} ${s}% ${l}%)`;
  };

  const readableOn = (busId: string | null): string => {
    const i = index(busId);
    if (i < 0) return "var(--color-on-surface)";
    // Luminosidade da rampa é fixa por tema, então a decisão é determinística.
    return l < 55 ? "#ffffff" : "#101418";
  };

  return { color, readableOn, index };
}

/** Rótulo exibível de um ônibus, tratando o balde de não identificado. */
export function busLabel(identifier: string): string {
  return identifier === UNKNOWN_BUS_KEY ? "Ônibus não identificado" : identifier;
}
