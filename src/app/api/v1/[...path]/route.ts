import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";
import { validateCsrfToken } from "@/lib/server/csrf";
import { PROXY_CSRF_ERROR_HEADER } from "@/lib/csrfProxyMarker";

function buildTargetUrl(path: string[], search: string): string {
  const base = getBackendApiBaseUrl();
  const suffix = path.join("/");
  return `${base}/${suffix}${search}`;
}

async function proxy(request: NextRequest, path: string[]) {
  if (path[0] === "auth") {
    return NextResponse.json(
      { message: "Use /api/auth/* para operações de autenticação." },
      { status: 404 },
    );
  }

  const method = request.method.toUpperCase();
  const isMutating =
    method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  // Fix #04 (achado #7): defesa em profundidade (CSRF double-submit) nas
  // mutações que passam pelo proxy de negócio — mesmo padrão já existente
  // no student-frontend. SameSite=lax do cookie de sessão não cobre XSS
  // same-site nem navegação top-level.
  //
  // Header PROXY_CSRF_ERROR_HEADER (não a mensagem) é o marcador que
  // services/http.ts usa pra decidir se um 403 é retry-safe (rejeitado
  // aqui, antes de qualquer chamada ao backend — nenhuma escrita ainda
  // aconteceu) ou se veio do backend por outro motivo (ex.: guard de role,
  // ownership check em cancel-scheduled-notice/delete-notice), caso em que
  // não é seguro presumir reenvio idêntico. Não usar a string de mensagem
  // como marcador — mensagem é pra humano, pode colidir por acaso com uma
  // resposta legítima do backend.
  if (isMutating && !(await validateCsrfToken(request))) {
    return NextResponse.json(
      { message: "Invalid CSRF token" },
      { status: 403, headers: { [PROXY_CSRF_ERROR_HEADER]: "1" } },
    );
  }

  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;
  const targetUrl = buildTargetUrl(path, request.nextUrl.search);

  const headers = new Headers();
  const incomingContentType = request.headers.get("content-type");
  const incomingAccept = request.headers.get("accept");

  if (incomingContentType) headers.set("content-type", incomingContentType);
  if (incomingAccept) headers.set("accept", incomingAccept);

  headers.set("x-service-secret", getServiceSecret());
  if (sid) {
    headers.set("x-session-id", sid);
  }

  const canHaveBody = method !== "GET" && method !== "HEAD";
  const payload = canHaveBody ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: payload,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}
