import type { Bus } from "@/types/university.types";

/** Períodos da grade de horários, na ordem exibida. */
export const SCHEDULE_PERIODS = ["Manhã", "Tarde", "Noite"] as const;
export type SchedulePeriod = (typeof SCHEDULE_PERIODS)[number];

/** Turno "Integral" libera qualquer período da grade e qualquer ônibus. */
export const FULL_TIME_SHIFT = "Integral";

/**
 * Normaliza o turno para comparação: sem acento, sem espaços nas pontas e em
 * minúsculas. O turno do ônibus é texto livre no banco ("manha", "Manhã"), então
 * comparar cru deixaria ônibus válidos fora do filtro.
 */
export function normalizeShift(shift: string | null | undefined): string {
  if (!shift) return "";
  return shift
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function isFullTimeShift(shift: string | null | undefined): boolean {
  return normalizeShift(shift) === normalizeShift(FULL_TIME_SHIFT);
}

/**
 * O período da grade pode ser marcado no turno escolhido?
 * - sem turno: nada pode ser marcado (a grade fica bloqueada);
 * - Integral: qualquer período;
 * - demais: só o período igual ao turno.
 */
export function isPeriodAllowedForShift(
  period: string,
  shift: string | null | undefined,
): boolean {
  if (!shift) return false;
  if (isFullTimeShift(shift)) return true;
  return normalizeShift(period) === normalizeShift(shift);
}

/**
 * O ônibus atende o turno escolhido?
 * - Integral: atende qualquer ônibus;
 * - ônibus sem turno definido: entra em qualquer turno (não dá para excluí-lo
 *   sem informação e escondê-lo travaria o cadastro);
 * - demais: turno do ônibus igual ao turno escolhido.
 */
export function busMatchesShift(
  bus: Pick<Bus, "shift">,
  shift: string | null | undefined,
): boolean {
  if (isFullTimeShift(shift)) return true;
  if (!bus.shift) return true;
  return normalizeShift(bus.shift) === normalizeShift(shift);
}

/** Remove da grade os horários que o turno escolhido não permite. */
export function filterScheduleByShift<T extends { period: string }>(
  schedule: T[],
  shift: string | null | undefined,
): T[] {
  return schedule.filter((slot) => isPeriodAllowedForShift(slot.period, shift));
}
