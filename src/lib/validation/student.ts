import { z } from "zod";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

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
  password: z.string(),
  confirmPassword: z.string(),
});

export const studentCreateSchema = studentBaseSchema
  .extend({
    password: z
      .string({ error: "Senha e obrigatoria" })
      .min(1, "Senha e obrigatoria")
      .regex(PASSWORD_REGEX, "Minimo 8 caracteres com maiusculas, minusculas e numeros"),
    confirmPassword: z
      .string({ error: "Confirme a senha" })
      .min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  });

export const studentEditSchema = studentBaseSchema;
