import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  getSidMaxAgeSeconds,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";

type BackendSessionResponse = {
  ok?: true;
  sessionId?: string;
  user?: {
    id?: string;
    role?: "admin" | "employee" | "student";
    identifier?: string;
    name?: string;
  };
  message?: string;
};

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
    const body = (await request.json()) as { login?: string; password?: string };

    const login = typeof body.login === "string" ? body.login.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!login || !password) {
      return NextResponse.json({ message: "Credenciais inválidas." }, { status: 400 });
    }

    const base = getBackendApiBaseUrl();

    let upstream = await tryLogin(`${base}/auth/admin/login`, {
      username: login,
      password,
    });

    if (!upstream.ok) {
      upstream = await tryLogin(`${base}/auth/employee/login`, {
        registrationId: login,
        password,
      });
    }

    const data = (await upstream.json().catch(() => ({}))) as BackendSessionResponse;

    if (!upstream.ok) {
      return NextResponse.json(
        { message: typeof data.message === "string" ? data.message : "Credenciais inválidas." },
        { status: upstream.status || 401 },
      );
    }

    const sessionId = typeof data.sessionId === "string" ? data.sessionId : null;

    if (!sessionId) {
      return NextResponse.json(
        { message: "Resposta inválida do backend ao criar sessão." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: data.user?.id ?? "",
        role: data.user?.role === "admin" ? "admin" : "employee",
        identifier: data.user?.identifier ?? "",
        name:
          typeof data.user?.name === "string" && data.user.name.trim()
            ? data.user.name
            : data.user?.role === "admin"
              ? "Administrador"
              : "Funcionário",
      },
    });

    response.cookies.set(SID_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getSidMaxAgeSeconds(),
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Falha ao processar login." }, { status: 500 });
  }
}
