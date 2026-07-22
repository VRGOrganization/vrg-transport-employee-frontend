import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getSidMaxAgeSeconds,
  getServiceSecret,
  ROLE_COOKIE_NAME,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";
import { getCsrfHeaderName, setCsrfCookie } from "@/lib/server/csrf";
import { backendMeSchema } from "@/lib/validation/auth";

function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(SID_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(ROLE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function refreshAuthCookies(
  response: NextResponse,
  sid: string,
  role: "admin" | "employee",
): void {
  const maxAge = getSidMaxAgeSeconds(role);
  response.cookies.set(SID_COOKIE_NAME, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  response.cookies.set(ROLE_COOKIE_NAME, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function GET(request: NextRequest) {
  // Fix #04: toda resposta desta rota carrega um par csrf {headerName,
  // token} fresco — é o bootstrap que useEmployeeAuth.ensureCsrf() usa pra
  // alimentar o header CSRF das chamadas de negócio via services/http.ts.
  // Mesmo padrão do student-frontend (app/api/auth/session/route.ts).
  const csrfToken = await setCsrfCookie();
  const csrf = { headerName: getCsrfHeaderName(), token: csrfToken };

  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;

  if (!sid) {
    return NextResponse.json(
      { message: "Sessão não encontrada.", csrf },
      { status: 401 },
    );
  }

  try {
    const upstream = await fetch(`${getBackendApiBaseUrl()}/auth/me`, {
      method: "GET",
      headers: {
        "x-service-secret": getServiceSecret(),
        "x-session-id": sid,
      },
      cache: "no-store",
    });

    if (upstream.status === 401) {
      const response = NextResponse.json(
        { message: "Sessão inválida.", csrf },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { message: "Falha ao validar sessão.", csrf },
        { status: 502 },
      );
    }

    const mePayload = await upstream.json().catch(() => ({}));
    const meResult = backendMeSchema.safeParse(mePayload);

    if (!meResult.success) {
      return NextResponse.json(
        { message: "Resposta invalida ao carregar sessao.", csrf },
        { status: 502 },
      );
    }

    const meData = meResult.data;

    if (meData.userType !== "admin" && meData.userType !== "employee") {
      return NextResponse.json(
        { message: "Tipo de usuário não suportado neste frontend.", csrf },
        { status: 403 },
      );
    }

    const userId = meData.userId;

    const defaultName = meData.userType === "admin" ? "Administrador" : "Funcionário";

    const response = NextResponse.json({
      ok: true,
      csrf,
      user: {
        id: userId,
        role: meData.userType,
        identifier: typeof meData.identifier === "string" ? meData.identifier : userId,
        name: typeof meData.name === "string" && meData.name.trim()
          ? meData.name
          : defaultName,
      },
    });

    refreshAuthCookies(response, sid, meData.userType);

    return response;
  } catch {
    return NextResponse.json(
      { message: "Backend indisponível. Mantendo sessão local.", offline: true, csrf },
      { status: 503 },
    );
  }
}
