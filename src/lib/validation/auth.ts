import { z } from "zod";

const LOGIN_REGEX = /^[a-zA-Z0-9_.@+-]+$/;

export const employeeLoginRequestSchema = z.object({
  login: z
    .string({ error: "Login e obrigatorio" })
    .trim()
    .min(3, "Login deve ter no minimo 3 caracteres")
    .max(100, "Login deve ter no maximo 100 caracteres")
    .regex(LOGIN_REGEX, "Login contem caracteres invalidos"),
  password: z
    .string({ error: "Senha e obrigatoria" })
    .min(6, "Senha deve ter no minimo 6 caracteres")
    .max(100, "Senha deve ter no maximo 100 caracteres"),
    role: z.enum(["admin", "employee"], { 
    error: "Selecione um perfil de acesso",
  }),
});

export const employeeUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  identifier: z.string().min(1),
  role: z.enum(["admin", "employee"]),
  registrationId: z.string().optional(),
  email: z.string().optional(),
});

export const employeeAuthResponseSchema = z.object({
  ok: z.literal(true),
  user: employeeUserSchema,
});

export const csrfBootstrapSchema = z.object({
  csrfToken: z.string().min(1),
  csrfHeaderName: z.string().min(1),
});

export const backendSessionPayloadSchema = z.object({
  sessionId: z.string().min(1),
  user: z
    .object({
      id: z.string().optional(),
      role: z.enum(["admin", "employee", "student"]).optional(),
      identifier: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

export const backendMeSchema = z.object({
  userId: z.string().min(1),
  userType: z.enum(["admin", "employee", "student"]),
});

export const backendUserDetailSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
});

export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.entries(flat).reduce<Record<string, string>>((acc, [field, issues]) => {
    if (Array.isArray(issues) && issues.length > 0) {
      acc[field] = issues[0] ?? "Campo invalido";
    }
    return acc;
  }, {});
}
