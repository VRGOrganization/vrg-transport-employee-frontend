import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { validateCsrfToken } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";

function extractFirstError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): { message: string; errors: Record<string, string> } {
  const flat = error.flatten().fieldErrors;
  const errors = Object.entries(flat).reduce<Record<string, string>>((acc, [field, issues]) => {
    if (Array.isArray(issues) && issues.length > 0) acc[field] = issues[0] ?? "Campo inválido";
    return acc;
  }, {});
  const message = Object.values(errors)[0] ?? "Dados inválidos.";
  return { message, errors };
}

interface RouteGuardsOptions<TInput, TOutput> {
  rateLimitKey?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  requireCsrf?: boolean;
  schema?: ZodSchema<TInput>;
  handler: (input: TInput, request: NextRequest) => Promise<NextResponse<TOutput>>;
}

export function withAuthRouteGuards<TInput = void, TOutput = unknown>(
  opts: RouteGuardsOptions<TInput, TOutput>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      if (opts.rateLimitKey) {
        const xff = request.headers.get("x-forwarded-for") ?? "";
        const clientIp = xff.split(",")[0]?.trim() || "unknown";
        const max = opts.rateLimitMax ?? 3;
        const windowMs = opts.rateLimitWindowMs ?? 300_000;

        if (!checkRateLimit(`${opts.rateLimitKey}:${clientIp}`, max, windowMs)) {
          return NextResponse.json(
            { message: "Muitas tentativas. Tente novamente em 5 minutos." },
            { status: 429 },
          );
        }
      }

      if (opts.requireCsrf !== false) {
        if (!(await validateCsrfToken(request))) {
          return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 });
        }
      }

      let input: TInput = undefined as TInput;
      if (opts.schema) {
        const rawBody = await request.json().catch(() => ({}));
        const result = opts.schema.safeParse(rawBody);
        if (!result.success) {
          const { message, errors } = extractFirstError(result.error);
          return NextResponse.json({ message, errors }, { status: 400 });
        }
        input = result.data;
      }

      return await opts.handler(input, request);
    } catch (error) {
      console.error("[BFF][route-helpers] error:", error);
      return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
  };
}
