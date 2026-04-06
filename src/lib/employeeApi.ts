const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Lê o token do cookie (funciona no browser)
function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)employee_access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setTokens(accessToken: string, refreshToken: string) {
  // Apenas cookies — o middleware consegue ler
  // SameSite=Strict impede CSRF; omita HttpOnly aqui pois precisamos ler no cliente
  document.cookie = `employee_access_token=${encodeURIComponent(accessToken)}; path=/; SameSite=Strict; max-age=${60 * 15}`; // 15 min
  document.cookie = `employee_refresh_token=${encodeURIComponent(refreshToken)}; path=/; SameSite=Strict; max-age=${60 * 60 * 24 * 7}`; // 7 dias
}

export function clearTokens() {
  document.cookie = "employee_access_token=; path=/; max-age=0";
  document.cookie = "employee_refresh_token=; path=/; max-age=0";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { message: data?.message ?? "Erro desconhecido", status: res.status };
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