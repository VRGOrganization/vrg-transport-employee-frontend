import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getSidMaxAgeSeconds,
  getServiceSecret,
  ROLE_COOKIE_NAME,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";
import { backendMeSchema, backendUserDetailSchema } from "@/lib/validation/auth";

export async function GET(request: NextRequest) {
  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;

  if (!sid) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
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

    if (!upstream.ok) {
      const response = NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
      response.cookies.set(SID_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      response.cookies.set(ROLE_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const mePayload = await upstream.json().catch(() => ({}));
    const meResult = backendMeSchema.safeParse(mePayload);

    if (!meResult.success) {
      return NextResponse.json({ message: "Resposta invalida ao carregar sessao." }, { status: 502 });
    }

    const meData = meResult.data;

    if (meData.userType !== "admin" && meData.userType !== "employee") {
      return NextResponse.json({ message: "Tipo de usuário não suportado neste frontend." }, { status: 403 });
    }

    const userId = meData.userId;

    const defaultName = meData.userType === "admin" ? "Administrador" : "Funcionário";
    let resolvedName = defaultName;

    const detailPath = meData.userType === "employee"
      ? `/employee/${userId}`
      : `/admin/${userId}`;

    try {
      const detailResponse = await fetch(`${getBackendApiBaseUrl()}${detailPath}`, {
        method: "GET",
        headers: {
          "x-service-secret": getServiceSecret(),
          "x-session-id": sid,
        },
        cache: "no-store",
      });

      if (detailResponse.ok) {
        const detailPayload = await detailResponse.json().catch(() => ({}));
        const detailResult = backendUserDetailSchema.safeParse(detailPayload);
        const detailData = detailResult.success ? detailResult.data : null;

        if (detailData && typeof detailData.name === "string" && detailData.name.trim().length > 0) {
          resolvedName = detailData.name;
        } else if (
          detailData &&
          meData.userType === "admin" &&
          typeof detailData.username === "string" &&
          detailData.username.trim().length > 0
        ) {
          resolvedName = detailData.username;
        }
      }
    } catch {
      // Mantém fallback genérico sem falhar a sessão.
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        role: meData.userType,
        identifier: userId,
        name: resolvedName,
      },
    });

    response.cookies.set(ROLE_COOKIE_NAME, meData.userType, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSidMaxAgeSeconds(meData.userType),
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Falha ao carregar sessão." }, { status: 500 });
  }
}
