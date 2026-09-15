import { NextResponse } from "next/server";

// Endpoint público de health check, para uso por sistemas de monitoramento
// (ex.: painel de analytics interno). Fora do proxy (o matcher lista só "/",
// "/admin/:path*", "/employee/:path*" e "/login" — "/api/health" não entra em
// nenhum), não toca sessão nem backend.
//
// A raiz "/" não serve para isso: ela sempre redireciona (307) para /login ou
// para o dashboard do papel logado, então um health check que segue apenas o
// status HTTP direto a marcaria como fora do ar.

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
