export const SID_COOKIE_NAME = "_atk";
export const ROLE_COOKIE_NAME = "_atk_role";

function normalizeApiBaseUrl(rawValue: string): string {
  const base = rawValue.trim().replace(/\/+$/, "");

  if (!base) return "";
  if (/\/api\/v1$/i.test(base)) return base;

  return `${base}/api/v1`;
}

export function getBackendApiBaseUrl(): string {
  const rawApiTarget =
    process.env.API_PROXY_TARGET ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000";

  const base = rawApiTarget
    .trim()
    .replace(/\/api\/v1\/?$/i, "")
    .replace(/\/+$/, "");

  return normalizeApiBaseUrl(base);
}

export function getServiceSecret(): string {
  const secret = process.env.BFF_SERVICE_SECRET ?? process.env.SERVICE_SECRET;

  if (!secret || !secret.trim()) {
    throw new Error("BFF_SERVICE_SECRET (ou SERVICE_SECRET) não configurado no frontend employee.");
  }

  return secret.trim();
}

export function getSidMaxAgeSeconds(): number {
  const raw = process.env.SESSION_TTL_DAYS?.trim();
  const days = raw && /^\d+$/.test(raw) ? Number(raw) : 7;
  return days * 24 * 60 * 60;
}
