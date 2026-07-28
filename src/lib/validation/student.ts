import { z } from "zod";

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export { PASSWORD_POLICY_REGEX };

// Edição de aluno (admin/funcionário): email e CPF não entram aqui — o
// backend não aceita alterá-los por essa rota (UpdateStudentDto não tem
// esses campos), então não faz sentido validá-los como se fossem editáveis.
export const studentEditSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  socialName: z
    .string()
    .max(100, "Nome social deve ter no máximo 100 caracteres")
    .optional(),
  telephone: z
    .string({ error: "Telefone é obrigatório" })
    .trim()
    .min(1, "Telefone é obrigatório"),
  institution: z.string().optional(),
  shift: z.string().optional(),
  bloodType: z.string().optional(),
  degree: z.string().optional(),
});

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
