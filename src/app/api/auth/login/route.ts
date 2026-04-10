import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  getSidMaxAgeSeconds,
  ROLE_COOKIE_NAME,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";
import { validateCsrfToken } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";
import {
  backendSessionPayloadSchema,
  employeeLoginRequestSchema,
  getFieldErrors,
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

export async function POST(request: NextRequest) {
  try {
    const xff = request.headers.get("x-forwarded-for") ?? "";
    const clientIp = xff.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(`login:${clientIp}`, 3, 300000)) {
      return NextResponse.json(
        { message: "Muitas tentativas. Tente novamente em 5 minutos." },
        { status: 429 },
      );
    }

    if (!(await validateCsrfToken(request))) {
      return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 });
    }

    const rawBody = await request.json();
    const bodyResult = employeeLoginRequestSchema.safeParse(rawBody);

    if (!bodyResult.success) {
      const fieldErrors = getFieldErrors(bodyResult.error);
      const firstError = Object.values(fieldErrors)[0] ?? "Dados de login invalidos.";
      return NextResponse.json({ message: firstError, errors: fieldErrors }, { status: 400 });
    }

    const { login, password, role } = bodyResult.data;

    const base = getBackendApiBaseUrl();
    const endpoint = role === "admin" ? "/auth/admin/login" : "/auth/employee/login";
    const payload = role === "admin"
      ? { username: login, password }
      : { registrationId: login, password };

    const upstream = await tryLogin(`${base}${endpoint}`, payload);

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
      sameSite: "strict",
      path: "/",
      maxAge: getSidMaxAgeSeconds(),
    });

    response.cookies.set(ROLE_COOKIE_NAME, resolvedRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSidMaxAgeSeconds(),
    });

    return response;
  } catch (error) {
    console.error("[BFF][auth/login] error:", error);
    return NextResponse.json(
      { message: "Erro ao processar login. Tente novamente." },
      { status: 500 },
    );
  }
}
