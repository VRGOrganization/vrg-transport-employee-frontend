import { z } from "zod";
import { PASSWORD_REGEX } from "@/lib/constants";

export const employeeBaseSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().min(1, "Email é obrigatório").email("Email inválido"),
  registrationId: z.string().trim().min(1, "Matrícula é obrigatória"),
});

export const employeeCreateSchema = employeeBaseSchema;

export const employeeEditSchema = employeeBaseSchema
  .extend({
    password: z
      .string()
      .regex(PASSWORD_REGEX, "Mínimo 8 caracteres com maiúsculas, minúsculas e números")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional(),
  })
  .refine((d) => !d.password || d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });
