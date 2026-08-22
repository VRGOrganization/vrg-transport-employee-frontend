"use client";

import type { ApiError } from "@/types/api";
import { PROXY_CSRF_ERROR_HEADER } from "@/lib/csrfProxyMarker";

export const API_BASE_URL = "/api/v1";

interface CsrfMeta {
  headerName: string;
  token: string;
}

const httpState = {
  onUnauthorized: null as (() => void) | null,
  ensureCsrf: null as
    | ((forceRefresh?: boolean) => Promise<CsrfMeta | null>)
    | null,
};

export function configureHttp(opts: {
  onUnauthorized: () => void;
  ensureCsrf?: (forceRefresh?: boolean) => Promise<CsrfMeta | null>;
}) {
  httpState.onUnauthorized = opts.onUnauthorized;
  httpState.ensureCsrf = opts.ensureCsrf ?? null;
}

export function resetHttpState(): void {
  httpState.onUnauthorized = null;
  httpState.ensureCsrf = null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const requiresCsrf = method !== "GET" && method !== "HEAD";

  const execute = async (csrf: CsrfMeta | null): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(!(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers as Record<string, string> | undefined),
    };
    if (csrf) headers[csrf.headerName] = csrf.token;

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let res = await execute(
    requiresCsrf && httpState.ensureCsrf ? await httpState.ensureCsrf() : null,
  );

  // Token CSRF pode ter expirado — renova uma vez e reenvia. Só reenvia se
  // o 403 tiver o marcador de origem-proxy (PROXY_CSRF_ERROR_HEADER) — um
  // 403 de negócio real (ex.: guard de role, ownership check em
  // cancel-scheduled-notice/delete-notice) não tem esse header e não é
  // reenviado; presumir "é CSRF" por status sozinho arriscaria reenviar
  // uma mutação que o backend rejeitou por outro motivo.
  const isCsrfRejection =
    res.status === 403 && res.headers.has(PROXY_CSRF_ERROR_HEADER);
  if (requiresCsrf && isCsrfRejection && httpState.ensureCsrf) {
    res = await execute(await httpState.ensureCsrf(true));
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    httpState.onUnauthorized?.();
  }

  if (!res.ok) {
    // O NestJS ValidationPipe retorna `message` como array quando várias
    // regras falham (ex.: vários decorators no mesmo campo) — sem isso, o
    // array acaba renderizado em JSX como texto concatenado sem espaço.
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(" ")
      : (rawMessage ?? "Erro desconhecido");
    const error: ApiError = {
      message,
      status: res.status,
      retryAfterMs: data?.retryAfterMs ?? null,
      details: data,
    };
    throw error;
  }

  return data as T;
}

export const http = {
  get:    <T>(path: string)                => request<T>(path, { method: "GET" }),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH",  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: "POST",  body: form }),
  patchForm: <T>(path: string, form: FormData) => request<T>(path, { method: "PATCH", body: form }),
};
