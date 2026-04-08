import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sid = request.cookies.get("_atk")?.value;

  if (pathname === "/") {
    if (!sid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.redirect(new URL("/employee/dashboard", request.url));
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Se ja esta logado e tenta acessar /login, redireciona pro dashboard
  if (isPublic && sid) {
    return NextResponse.redirect(new URL("/employee/dashboard", request.url));
  }

  // Rota protegida sem token -> login
  if (!isPublic && !sid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname); // preserva destino
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/employee/:path*", "/login"],
};