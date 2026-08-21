import {
  DAYS,
  PERIODS,
  UNKNOWN_COURSE_KEY,
  type Day,
  type Period,
} from "@/types/info.types";

/**
 * Resolve um id que pode chegar como string, como `{ _id }` populado, ou como
 * ObjectId serializado. O backend varia conforme o endpoint popular ou não a
 * referência.
 */
export function resolveId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "object") {
    const nested = (value as { _id?: unknown })._id;
    if (typeof nested === "string") return nested || null;
    if (nested && typeof nested === "object") return String(nested) || null;
    // ObjectId sem _id: cai no toString do próprio valor.
    const asString = String(value);
    return asString && asString !== "[object Object]" ? asString : null;
  }
  return null;
}

/**
 * Normaliza o nome de um curso para casar `Student.degree` (texto livre, sem
 * FK) com a collection `courses`. Sem acento, sem caixa, sem espaço duplicado.
 */
export function normalizeCourseName(value: string | null | undefined): string {
  if (!value) return UNKNOWN_COURSE_KEY;
  const key = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
  return key || UNKNOWN_COURSE_KEY;
}

/** Primeira letra maiúscula, para exibir um `degree` que não casou com curso. */
export function titleCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLocaleUpperCase("pt-BR") + trimmed.slice(1);
}

export function isDay(value: unknown): value is Day {
  return typeof value === "string" && (DAYS as readonly string[]).includes(value);
}

export function isPeriod(value: unknown): value is Period {
  return typeof value === "string" && (PERIODS as readonly string[]).includes(value);
}

export function dayIndex(day: Day): number {
  return DAYS.indexOf(day);
}

export function periodIndex(period: Period): number {
  return PERIODS.indexOf(period);
}

/**
 * Turno declarado do aluno → período de viagem. `Integral` não é um período de
 * viagem (o aluno viaja em vários), então vira `null`.
 */
export function toPeriod(shift: string | null | undefined): Period | null {
  return isPeriod(shift) ? shift : null;
}

/** Ordena identificadores de ônibus com consciência numérica ("2" < "10"). */
export function compareIdentifiers(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}
