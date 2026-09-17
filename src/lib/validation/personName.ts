import { z } from "zod";

// Espelha vrg-transport-backend/src/shared/utils/person-name.utils.ts: o
// serviço que desenha a carteirinha só aceita letras, espaço, apóstrofo,
// ponto e hífen, e um nome fora disso só falharia na aprovação.
export const PERSON_NAME_MAX_LENGTH = 100;
export const PERSON_NAME_PATTERN = /^(?=.*\p{L})[\p{L} '.-]+$/u;
export const PERSON_NAME_INVALID_MESSAGE =
  "Use apenas letras, espaços, apóstrofo, ponto e hífen.";

const TYPOGRAPHIC_APOSTROPHES = /[‘’ʼ]/g;
const HYPHEN_VARIANTS = /[‐‑‒–—−]/g;

export function normalizePersonName(value: string): string {
  return value
    .normalize("NFC")
    .replace(TYPOGRAPHIC_APOSTROPHES, "'")
    .replace(HYPHEN_VARIANTS, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function personNameSchema(label: string) {
  return z
    .string({ error: `${label} é obrigatório` })
    .transform(normalizePersonName)
    .pipe(
      z
        .string()
        .min(1, `${label} é obrigatório`)
        .max(
          PERSON_NAME_MAX_LENGTH,
          `${label} deve ter no máximo ${PERSON_NAME_MAX_LENGTH} caracteres`,
        )
        .regex(PERSON_NAME_PATTERN, PERSON_NAME_INVALID_MESSAGE),
    );
}
