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
  EmployeeAuthResponse,
} from "@/types/employeeAuth";

export function useEmployeeAuth() {
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const clearSession = useCallback(() => {
    setUser(null);
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
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          clearSession();
          return;
        }

        const data = (await response.json()) as EmployeeAuthResponse;
        setUser(data.user);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, [clearSession]);

  const login = async (credentials: EmployeeLoginCredentials) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          login: credentials.login,
          password: credentials.password,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        user?: EmployeeUser;
        message?: string;
      };

      if (!response.ok || !payload.user) {
        return {
          success: false,
          error: typeof payload.message === "string" ? payload.message : "Credenciais inválidas",
        };
      }

      setUser(payload.user);

      if (payload.user.role === "admin") {
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
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
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