import { z } from "zod";
import { PASSWORD_REGEX } from "@/lib/constants";

const studentBaseSchema = z.object({
  name: z
    .string({ error: "Nome e obrigatorio" })
    .trim()
    .min(1, "Nome e obrigatorio")
    .max(100, "Nome deve ter no maximo 100 caracteres"),
  email: z
    .string({ error: "Email e obrigatorio" })
    .trim()
    .min(1, "Email e obrigatorio")
    .email("Email invalido"),
  telephone: z
    .string({ error: "Telefone e obrigatorio" })
    .trim()
    .min(1, "Telefone e obrigatorio"),
  institution: z
    .string({ error: "Selecione uma instituicao" })
    .min(1, "Selecione uma instituicao"),
  shift: z
    .string({ error: "Selecione um turno" })
    .refine((value) => value === "diurno" || value === "noturno", "Selecione um turno"),
  cpf: z
    .string({ error: "CPF e obrigatorio" })
    .trim()
    .regex(/^\d{11}$/, "CPF deve conter 11 digitos"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

export const studentCreateSchema = studentBaseSchema.extend({
  password: z
    .string({ error: "Senha e obrigatoria" })
    .regex(PASSWORD_REGEX, { error: "Senha deve conter maiuscula, minuscula e numero" }),
  confirmPassword: z.string().optional(),
});

export const studentEditSchema = studentBaseSchema;
