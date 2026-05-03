import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";

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

  const method = request.method.toUpperCase();
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
