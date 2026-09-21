import type { NextRequest } from "next/server";

/**
 * IP real do cliente, lido dos headers que o proxy na frente do Next coloca.
 * `"unknown"` quando não dá para resolver.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Header de IP do cliente para o fetch upstream, pronto pra espalhar dentro
 * do objeto de headers.
 *
 * Sem ele o backend enxerga só o IP deste container, e todo rate limit por
 * IP colapsa numa chave única para a plataforma inteira: foi exatamente o
 * que deixou o forgot-password com 5 pedidos por hora no sistema todo.
 *
 * IP desconhecido não vira header: o guard do backend já trata IP ausente
 * ou não parseável, e mandar `"unknown"` só sujaria a chave do balde.
 */
export function forwardedFor(clientIp: string): Record<string, string> {
  return clientIp && clientIp !== "unknown"
    ? { "x-forwarded-for": clientIp }
    : {};
}
