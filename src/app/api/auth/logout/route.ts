import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";

export async function POST(request: NextRequest) {
  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;

  try {
    const headers: HeadersInit = {
      "x-service-secret": getServiceSecret(),
    };

    if (sid) {
      headers["x-session-id"] = sid;
    }

    await fetch(`${getBackendApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
  } catch {
    // Logout é idempotente por contrato.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SID_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
