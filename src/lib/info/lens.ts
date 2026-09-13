import {
  EMPTY_LENS,
  type InfoLens,
  type InfoMetric,
  type Seat,
} from "@/types/info.types";
import { isDay, isPeriod } from "./normalize";

/**
 * Aplica a lente sobre os assentos. É uma redução em memória: trocar de
 * faculdade, curso, ônibus, turno, dia ou período NÃO refaz requisição —
 * só a troca de ciclo vai à rede.
 */
export function applyLens(seats: Seat[], lens: InfoLens): Seat[] {
  return seats.filter((seat) => {
    if (lens.universityId && seat.universityId !== lens.universityId) return false;
    if (lens.courseKey && seat.courseKey !== lens.courseKey) return false;
    if (lens.busId && seat.busId !== lens.busId) return false;
    // `shift` é o turno DECLARADO do aluno; `period` é o turno da viagem.
    // São filtros diferentes de propósito.
    if (lens.shift && seat.shift !== lens.shift) return false;
    if (lens.day && seat.day !== lens.day) return false;
    if (lens.period && seat.period !== lens.period) return false;
    return true;
  });
}

/** `true` quando há algum recorte além do ciclo e da métrica. */
export function hasActiveFilters(lens: InfoLens): boolean {
  return Boolean(
    lens.universityId ||
      lens.courseKey ||
      lens.busId ||
      lens.shift ||
      lens.day ||
      lens.period,
  );
}

const PARAM_KEYS = {
  cycleId: "cycle",
  universityId: "uni",
  courseKey: "course",
  busId: "bus",
  shift: "shift",
  day: "day",
  period: "period",
  metric: "metric",
} as const;

/** Serializa a lente para a URL. Valores padrão são omitidos. */
export function lensToSearchParams(lens: InfoLens): URLSearchParams {
  const params = new URLSearchParams();
  if (lens.cycleId) params.set(PARAM_KEYS.cycleId, lens.cycleId);
  if (lens.universityId) params.set(PARAM_KEYS.universityId, lens.universityId);
  if (lens.courseKey) params.set(PARAM_KEYS.courseKey, lens.courseKey);
  if (lens.busId) params.set(PARAM_KEYS.busId, lens.busId);
  if (lens.shift) params.set(PARAM_KEYS.shift, lens.shift);
  if (lens.day) params.set(PARAM_KEYS.day, lens.day);
  if (lens.period) params.set(PARAM_KEYS.period, lens.period);
  if (lens.metric !== "pessoas") params.set(PARAM_KEYS.metric, lens.metric);
  return params;
}

/**
 * Reconstrói a lente a partir da URL. Valores inválidos viram `null` em vez de
 * quebrar — um link editado à mão não deve derrubar a página.
 */
export function lensFromSearchParams(
  params: URLSearchParams | Readonly<URLSearchParams>,
): InfoLens {
  const get = (key: string) => params.get(key) || null;

  const shift = get(PARAM_KEYS.shift);
  const day = get(PARAM_KEYS.day);
  const period = get(PARAM_KEYS.period);
  const metric = get(PARAM_KEYS.metric);

  return {
    cycleId: get(PARAM_KEYS.cycleId),
    universityId: get(PARAM_KEYS.universityId),
    courseKey: get(PARAM_KEYS.courseKey),
    busId: get(PARAM_KEYS.busId),
    shift: isPeriod(shift) ? shift : null,
    day: isDay(day) ? day : null,
    period: isPeriod(period) ? period : null,
    metric: metric === "pernas" ? "pernas" : "pessoas",
  };
}

/** Limpa os recortes, preservando ciclo e métrica (que não são "filtros"). */
export function clearFilters(lens: InfoLens): InfoLens {
  return { ...EMPTY_LENS, cycleId: lens.cycleId, metric: lens.metric };
}

export function isMetric(value: unknown): value is InfoMetric {
  return value === "pessoas" || value === "pernas";
}
