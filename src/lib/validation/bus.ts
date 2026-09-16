import { z } from "zod";

// Identificador do ônibus: sempre 2 dígitos numéricos (ex: 01, 02), único entre os ônibus.
const BUS_IDENTIFIER_REGEX = /^\d{2}$/;

export const busFormSchema = z.object({
  identifier: z
    .string({ error: "O identificador é obrigatório." })
    .trim()
    .min(1, "O identificador é obrigatório.")
    .regex(
      BUS_IDENTIFIER_REGEX,
      "O identificador deve conter exatamente 2 dígitos numéricos (ex: 01, 02).",
    ),
  // Vazia = sem limite de capacidade; quando informada, precisa ser inteiro >= 1.
  capacity: z.string().refine((value) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;
    const parsed = parseInt(trimmed, 10);
    return !Number.isNaN(parsed) && parsed >= 1;
  }, "Capacidade deve ser um número maior que zero ou vazia para sem limite."),
  shift: z.string(),
});

export type BusFormValues = z.infer<typeof busFormSchema>;
