import { NextRequest, NextResponse } from "next/server";
import { ROLE_COOKIE_NAME, SID_COOKIE_NAME } from "@/lib/server/bff-auth";

const PUBLIC_PATHS = ["/login"];

function getDashboardPath(role: "admin" | "employee"): string {
  return role === "admin" ? "/admin/dashboard" : "/employee/dashboard";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;
  const rawRole = request.cookies.get(ROLE_COOKIE_NAME)?.value;
  const role = rawRole === "admin" || rawRole === "employee" ? rawRole : null;

  if (pathname === "/") {
    if (!sid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Se ja esta logado e tenta acessar /login, redireciona pro dashboard
  if (isPublic && sid) {
    if (!role) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
  }

  // Rota protegida sem token -> login
  if (!isPublic && !sid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname); // preserva destino
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    if (role === "employee") {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/employee") && role !== "employee" && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/employee/:path*", "/login"],
};