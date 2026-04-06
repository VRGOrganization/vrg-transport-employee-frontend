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

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        role: meData.userType,
        identifier: userId,
        name: meData.userType === "admin" ? "Administrador" : "Funcionário",
      },
    });
  } catch {
    return NextResponse.json({ message: "Falha ao carregar sessão." }, { status: 500 });
  }
}
