import { z } from "zod";

export const employeeBaseSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().min(1, "Email é obrigatório").email("Email inválido"),
  registrationId: z.string().trim().min(1, "Matrícula é obrigatória"),
});

export const employeeCreateSchema = employeeBaseSchema;

export const employeeEditSchema = employeeBaseSchema;
