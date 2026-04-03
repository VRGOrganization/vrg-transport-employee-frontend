import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("employee_access_token")?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Se já está logado e tenta acessar /login, redireciona pro dashboard
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Rota protegida sem token → login
  if (!isPublic && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname); // preserva destino
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/login"],
};