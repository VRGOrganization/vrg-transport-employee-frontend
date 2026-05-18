"use client";

import type { ApiError } from "@/types/api";

export const API_BASE_URL = "/api/v1";

let onUnauthorized: (() => void) | null = null;

export function configureHttp(opts: { onUnauthorized: () => void }) {
  onUnauthorized = opts.onUnauthorized;
}

export function resetHttpState(): void {
  onUnauthorized = null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    ...(!(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    onUnauthorized?.();
  }

  if (!res.ok) {
    const error: ApiError = {
      message: data?.message ?? "Erro desconhecido",
      status: res.status,
    };
    throw error;
  }

  return data as T;
}

export const http = {
  get:    <T>(path: string)                => request<T>(path, { method: "GET" }),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(path, { method: "DELETE" }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: "POST",  body: form }),
  patchForm: <T>(path: string, form: FormData) => request<T>(path, { method: "PATCH", body: form }),
};
