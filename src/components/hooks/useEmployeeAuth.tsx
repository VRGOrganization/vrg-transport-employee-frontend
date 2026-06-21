"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  configureEmployeeApi,
  resetEmployeeApiState,
} from "@/lib/employeeApi";
import {
  EmployeeUser,
  EmployeeLoginCredentials,
} from "@/types/employeeAuth";
import {
  csrfBootstrapSchema,
  employeeAuthResponseSchema,
  employeeLoginRequestSchema,
} from "@/lib/validation/auth";

const AUTH_SNAPSHOT_KEY = "vrg:employee-auth-snapshot";
const AUTH_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;

interface AuthSnapshot {
  user: EmployeeUser;
  expiresAt: number;
}

function isNavigatorOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function readAuthSnapshot(): EmployeeUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_SNAPSHOT_KEY);
    if (!raw) return null;

    const snapshot = JSON.parse(raw) as Partial<AuthSnapshot>;
    const authResult = employeeAuthResponseSchema.safeParse({
      ok: true,
      user: snapshot.user,
    });

    if (
      !authResult.success ||
      typeof snapshot.expiresAt !== "number" ||
      snapshot.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(AUTH_SNAPSHOT_KEY);
      return null;
    }

    return authResult.data.user;
  } catch {
    return null;
  }
}

function persistAuthSnapshot(user: EmployeeUser): void {
  if (typeof window === "undefined") return;

  try {
    const snapshot: AuthSnapshot = {
      user,
      expiresAt: Date.now() + AUTH_SNAPSHOT_TTL_MS,
    };
    window.localStorage.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Snapshot offline é best-effort.
  }
}

function clearAuthSnapshot(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(AUTH_SNAPSHOT_KEY);
  } catch {
    // Snapshot offline é best-effort.
  }
}

export function useEmployeeAuth() {
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const clearSession = useCallback(() => {
    clearAuthSnapshot();
    setUser(null);
  }, []);

  const restoreSnapshot = useCallback((): boolean => {
    const snapshotUser = readAuthSnapshot();
    if (!snapshotUser) return false;

    setUser(snapshotUser);
    return true;
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [clearSession, router]);

  useEffect(() => {
    resetEmployeeApiState();
    configureEmployeeApi({ onUnauthorized: handleUnauthorized });
  }, [handleUnauthorized]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isNavigatorOffline()) {
          restoreSnapshot();
          return;
        }

        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            clearSession();
            return;
          }

          restoreSnapshot();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        const sessionResult = employeeAuthResponseSchema.safeParse(payload);

        if (!sessionResult.success) {
          clearSession();
          return;
        }

        setUser(sessionResult.data.user);
        persistAuthSnapshot(sessionResult.data.user);
      } catch {
        restoreSnapshot();
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, [clearSession, restoreSnapshot]);

  const getCsrfHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const response = await fetch("/api/auth/csrf", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    const csrfResult = csrfBootstrapSchema.safeParse(payload);

    if (!response.ok || !csrfResult.success) {
      throw new Error("Não foi possível inicializar a proteção CSRF.");
    }

    return { [csrfResult.data.csrfHeaderName.trim()]: csrfResult.data.csrfToken };
  }, []);

  const login = async (credentials: EmployeeLoginCredentials) => {
    setLoading(true);
    try {
      const credentialsResult = employeeLoginRequestSchema.safeParse(credentials);
      if (!credentialsResult.success) {
        const firstIssue = credentialsResult.error.issues[0]?.message ?? "Credenciais invalidas";
        return { success: false, error: firstIssue };
      }

      const csrfHeaders = await getCsrfHeaders();

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaders,
        },
        credentials: "include",
        body: JSON.stringify(credentialsResult.data),
      });

      const payload = await response.json().catch(() => ({}));
      const authResult = employeeAuthResponseSchema.safeParse(payload);

      if (!response.ok || !authResult.success) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof (payload as { message?: unknown }).message === "string"
            ? (payload as { message: string }).message
            : "Credenciais invalidas";
        return {
          success: false,
          error: message,
          rateLimited: response.status === 429,
        };
      }

      setUser(authResult.data.user);
      persistAuthSnapshot(authResult.data.user);

      if (authResult.data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/employee/dashboard");
      }

      return { success: true };
    } catch (err: unknown) {
      const error = err as { message?: string };
      return {
        success: false,
        error: error?.message ?? "Credenciais inválidas",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const csrfHeaders = await getCsrfHeaders();

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders,
      });
    } catch {
      // ignora erro de logout
    } finally {
      clearSession();
      router.push("/login");
    }
  };

  return { user, loading, login, logout };
}
