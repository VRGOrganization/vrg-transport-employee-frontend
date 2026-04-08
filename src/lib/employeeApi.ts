import type { EmployeeApiError } from "@/types/employeeAuth";

export const API_BASE_URL = "/api/v1";

let onUnauthorized: (() => void) | null = null;

export function configureEmployeeApi(opts: { onUnauthorized: () => void }) {
  onUnauthorized = opts.onUnauthorized;
}

export function resetEmployeeApiState(): void {
  onUnauthorized = null;
}

export function setTokens(_accessToken: string, _refreshToken: string) {
  // No-op: sessão agora é controlada por cookie httpOnly sid no BFF.
}

export function clearTokens() {
  // No-op: sessão agora é controlada por cookie httpOnly sid no BFF.
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
    const error: EmployeeApiError = {
      message: data?.message ?? "Erro desconhecido",
      status: res.status,
    };
    throw error;
  }

  return data as T;
}

export const employeeApi = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};