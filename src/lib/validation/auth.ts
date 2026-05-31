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
    .string({ error: "Senha é obrigatória" })
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(64, "Senha deve ter no máximo 64 caracteres"),
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
  name: z.string().optional(),
  identifier: z.string().optional(),
});

export const backendUserDetailSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: "Email é obrigatório" })
    .trim()
    .min(1, "Email é obrigatório")
    .email("Informe um email válido"),
});

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token inválido"),
    password: z
      .string({ error: "Senha é obrigatória" })
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .max(64, "Senha deve ter no máximo 64 caracteres")
      .regex(
        PASSWORD_POLICY_REGEX,
        "Senha deve conter maiúscula, minúscula, número e caractere especial",
      ),
    confirmPassword: z.string({ error: "Confirmação de senha é obrigatória" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
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
