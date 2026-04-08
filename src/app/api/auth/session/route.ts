import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";

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
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const meData = (await upstream.json()) as { userId?: string; userType?: "admin" | "employee" | "student" };

    if (meData.userType !== "admin" && meData.userType !== "employee") {
      return NextResponse.json({ message: "Tipo de usuário não suportado neste frontend." }, { status: 403 });
    }

    const userId = typeof meData.userId === "string" ? meData.userId : "";
    if (!userId) {
      return NextResponse.json({ message: "Resposta inválida ao carregar sessão." }, { status: 502 });
    }

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
        const detailData = (await detailResponse.json()) as {
          name?: string;
          username?: string;
        };

        if (typeof detailData.name === "string" && detailData.name.trim().length > 0) {
          resolvedName = detailData.name;
        } else if (
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

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        role: meData.userType,
        identifier: userId,
        name: resolvedName,
      },
    });
  } catch {
    return NextResponse.json({ message: "Falha ao carregar sessão." }, { status: 500 });
  }
}
