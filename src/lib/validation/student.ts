import { z } from "zod";

import {
  PERSON_NAME_INVALID_MESSAGE,
  PERSON_NAME_MAX_LENGTH,
  PERSON_NAME_PATTERN,
  normalizePersonName,
  personNameSchema,
} from "./personName";

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export { PASSWORD_POLICY_REGEX };

// Edição de aluno (admin/funcionário): email e CPF não entram aqui — o
// backend não aceita alterá-los por essa rota (UpdateStudentDto não tem
// esses campos), então não faz sentido validá-los como se fossem editáveis.
export const studentEditSchema = z.object({
  name: personNameSchema("Nome"),
  socialName: z
    .string()
    .transform(normalizePersonName)
    .pipe(
      z
        .string()
        .max(
          PERSON_NAME_MAX_LENGTH,
          `Nome social deve ter no máximo ${PERSON_NAME_MAX_LENGTH} caracteres`,
        )
        .refine(
          (value) => value.length === 0 || PERSON_NAME_PATTERN.test(value),
          PERSON_NAME_INVALID_MESSAGE,
        ),
    )
    .optional(),
  telephone: z
    .string({ error: "Telefone é obrigatório" })
    .trim()
    .min(1, "Telefone é obrigatório"),
  institution: z.string().optional(),
  shift: z.string().optional(),
  bloodType: z.string().optional(),
  degree: z.string().optional(),
  courseId: z.string().optional(),
});

export const studentAdminCreateSchema = z.object({
  name: personNameSchema("Nome"),
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
