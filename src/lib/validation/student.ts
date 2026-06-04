import { z } from "zod";

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

const studentBaseSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z
    .string({ error: "Email é obrigatório" })
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  telephone: z
    .string({ error: "Telefone é obrigatório" })
    .trim()
    .min(1, "Telefone é obrigatório"),
  institution: z.string().optional(),
  shift: z.string().optional(),
  bloodType: z.string().optional(),
  degree: z.string().optional(),
  cpf: z
    .string({ error: "CPF é obrigatório" })
    .trim()
    .regex(/^\d{11}$/, "CPF deve conter 11 dígitos"),
});

export { PASSWORD_POLICY_REGEX };
export const studentCreateSchema = studentBaseSchema;
export const studentEditSchema = studentBaseSchema;

export const studentAdminCreateSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z
    .string({ error: "Email é obrigatório" })
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  telephone: z
    .string({ error: "Telefone é obrigatório" })
    .trim()
    .min(1, "Telefone é obrigatório"),
  cpf: z
    .string({ error: "CPF é obrigatório" })
    .trim()
    .regex(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos"),
});
