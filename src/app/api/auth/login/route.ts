import { NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  getSidMaxAgeSeconds,
  ROLE_COOKIE_NAME,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";
import { withAuthRouteGuards } from "@/lib/server/route-helpers";
import {
  backendSessionPayloadSchema,
  employeeLoginRequestSchema,
} from "@/lib/validation/auth";

async function tryLogin(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-service-secret": getServiceSecret(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

function isUpstreamConnectivityError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;

  const message = (error.message ?? "").toLowerCase();
  if (!message.includes("fetch failed")) return false;

  const cause = error.cause as
    | { code?: string; errors?: Array<{ code?: string }> }
    | undefined;

  const directCode = cause?.code?.toUpperCase();
  if (directCode === "ECONNREFUSED" || directCode === "ETIMEDOUT") return true;

  if (Array.isArray(cause?.errors)) {
    const hasKnownCode = cause.errors.some((item) => {
      const code = item?.code?.toUpperCase();
      return code === "ECONNREFUSED" || code === "ETIMEDOUT";
    });
    if (hasKnownCode) return true;
  }

  return true;
}

export const POST = withAuthRouteGuards({
  rateLimitKey: "login",
  rateLimitMax: 10,
  rateLimitWindowMs: 300_000,
  schema: employeeLoginRequestSchema,
  handler: async ({ login, password, role }): Promise<NextResponse> => {
    const base = getBackendApiBaseUrl();
    const endpoint = role === "admin" ? "/auth/admin/login" : "/auth/employee/login";
    const payload = role === "admin"
      ? { username: login, password }
      : { registrationId: login, password };

    const upstreamResult = await tryLogin(`${base}${endpoint}`, payload)
      .then((res) => ({ type: "success" as const, res }))
      .catch((error) => {
        if (isUpstreamConnectivityError(error)) {
          return {
            type: "error" as const,
            response: NextResponse.json(
              {
                message:
                  "Não foi possível conectar ao backend de autenticação. Verifique se a API está rodando e acessível.",
              },
              { status: 503 },
            ),
          };
        }
        throw error;
      });

    if (upstreamResult.type === "error") return upstreamResult.response;
    const upstream = upstreamResult.res;

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        { message: "Login falhou. Verifique suas credenciais e tente novamente." },
        { status: 401 },
      );
    }

    const sessionResult = backendSessionPayloadSchema.safeParse(data);
    if (!sessionResult.success) {
      return NextResponse.json(
        { message: "Resposta inválida do backend ao criar sessão." },
        { status: 502 },
      );
    }

    const sessionId = sessionResult.data.sessionId;
    const resolvedRole = sessionResult.data.user?.role === "admin" ? "admin" : "employee";
    const sidMaxAgeSeconds = getSidMaxAgeSeconds(resolvedRole);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: sessionResult.data.user?.id ?? "",
        role: resolvedRole,
        identifier: sessionResult.data.user?.identifier ?? "",
        name:
          typeof sessionResult.data.user?.name === "string" && sessionResult.data.user.name.trim()
            ? sessionResult.data.user.name
            : sessionResult.data.user?.role === "admin"
              ? "Administrador"
              : "Funcionário",
      },
    });

    response.cookies.set(SID_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sidMaxAgeSeconds,
    });

    response.cookies.set(ROLE_COOKIE_NAME, resolvedRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sidMaxAgeSeconds,
    });

    return response;
  },
});
