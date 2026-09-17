import { z } from "zod";

// Identificador do ônibus: sempre 2 dígitos numéricos (ex: 01, 02), único entre os ônibus.
const BUS_IDENTIFIER_REGEX = /^\d{2}$/;
const POSITIVE_INTEGER_REGEX = /^\d+$/;

// Não há ônibus no turno da tarde: cada ônibus faz uma viagem, de manhã ou de noite.
export const BUS_SHIFTS = ["Manhã", "Noite"] as const;
export type BusShift = (typeof BUS_SHIFTS)[number];

export const busFormSchema = z.object({
  identifier: z
    .string({ error: "O identificador é obrigatório." })
    .trim()
    .min(1, "O identificador é obrigatório.")
    .regex(
      BUS_IDENTIFIER_REGEX,
      "O identificador deve conter exatamente 2 dígitos numéricos (ex: 01, 02).",
    ),
  // Vagas do ônibus por dia, compartilhadas entre as faculdades vinculadas.
  // Obrigatória: não existe ônibus sem limite.
  capacity: z.string().refine((value) => {
    const trimmed = value.trim();
    return POSITIVE_INTEGER_REGEX.test(trimmed) && Number(trimmed) >= 1;
  }, "Informe a capacidade: um número inteiro de pelo menos 1 vaga."),
  // String (e não enum) para o form poder começar vazio.
  shift: z
    .string()
    .refine(
      (value) => isBusShift(value),
      "Selecione o turno do ônibus: Manhã ou Noite.",
    ),
});

export type BusFormValues = z.infer<typeof busFormSchema>;

export function isBusShift(value: unknown): value is BusShift {
  return (BUS_SHIFTS as readonly unknown[]).includes(value);
}
