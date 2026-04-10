export const SID_COOKIE_NAME = "_atk";
export const ROLE_COOKIE_NAME = "_atk_role";

type StaffRole = "admin" | "employee";

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

function parseTtlDays(raw: string, envName: string): number {
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${envName} deve conter apenas números inteiros.`);
  }

  const days = Number(raw);
  if (days <= 0) {
    throw new Error(`${envName} deve ser maior que zero.`);
  }

  return days;
}

function getOptionalTtlDays(envName: string): number | undefined {
  const raw = process.env[envName]?.trim();
  if (!raw) return undefined;
  return parseTtlDays(raw, envName);
}

export function getSidMaxAgeSeconds(role: StaffRole = "employee"): number {
  const roleEnv = role === "admin" ? "SESSION_TTL_ADMIN_DAYS" : "SESSION_TTL_EMPLOYEE_DAYS";
  const days =
    getOptionalTtlDays(roleEnv) ??
    getOptionalTtlDays("SESSION_TTL_STAFF_DAYS") ??
    getOptionalTtlDays("SESSION_TTL_DAYS") ??
    1;

  return days * 24 * 60 * 60;
}
