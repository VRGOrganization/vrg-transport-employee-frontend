"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { employeeApi, setTokens, clearTokens } from "@/lib/employeeApi";
import { EmployeeUser, EmployeeLoginCredentials } from "@/types/employeeAuth";

export function useEmployeeAuth() {
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("employee_access_token");
        if (!token) return;

        // Tenta buscar o perfil baseado no papel do usuário
        // Como não temos um endpoint /me unificado, tentamos admin primeiro
        try {
          const adminData = await employeeApi.get<EmployeeUser>("/admin/me");
          setUser({ ...adminData, role: "admin" });
        } catch {
          try {
            const employeeData = await employeeApi.get<EmployeeUser>("/employee/me");
            setUser({ ...employeeData, role: "employee" });
          } catch {
            clearTokens();
          }
        }
      } catch {
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: EmployeeLoginCredentials) => {
    setLoading(true);
    try {
      // Primeiro tenta login como admin
      let response;
      try {
        response = await employeeApi.post<{
          access_token: string;
          refresh_token: string;
          user: EmployeeUser;
        }>("/auth/admin/login", {
          username: credentials.login, // admin usa username
          password: credentials.password,
        });
        response.user.role = "admin";
      } catch (adminError) {
        // Se falhar, tenta login como funcionário (com matrícula)
        response = await employeeApi.post<{
          access_token: string;
          refresh_token: string;
          user: EmployeeUser;
        }>("/auth/employee/login", {
          registrationId: credentials.login, // funcionário usa matrícula
          password: credentials.password,
        });
        response.user.role = "employee";
      }

      setTokens(response.access_token, response.refresh_token);
      setUser(response.user);

      // Redireciona baseado no papel
      if (response.user.role === "admin") {
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
      await employeeApi.post("/auth/logout", {});
    } catch {
      // ignora erro de logout
    } finally {
      clearTokens();
      setUser(null);
      router.push("/login");
    }
  };

  return { user, loading, login, logout };
}