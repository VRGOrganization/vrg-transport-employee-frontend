import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEmployeeAuth } from "./useEmployeeAuth";

const mocks = vi.hoisted(() => ({
  pushMock: vi.fn(),
  configureEmployeeApiMock: vi.fn(),
  resetEmployeeApiStateMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.pushMock,
  }),
}));

vi.mock("@/lib/employeeApi", () => ({
  configureEmployeeApi: mocks.configureEmployeeApiMock,
  resetEmployeeApiState: mocks.resetEmployeeApiStateMock,
}));

describe("useEmployeeAuth", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve encerrar carregamento e manter sessao nula quando /session retorna 401", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Sessao nao encontrada" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const { result } = renderHook(() => useEmployeeAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(mocks.resetEmployeeApiStateMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(mocks.configureEmployeeApiMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("deve autenticar admin com CSRF e redirecionar para dashboard admin", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Sessao nao encontrada" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            csrfToken: "token-123",
            csrfHeaderName: "x-csrf-token",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            user: {
              id: "507f1f77bcf86cd799439011",
              role: "admin",
              identifier: "ADM001",
              name: "Admin Teste",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const { result } = renderHook(() => useEmployeeAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult: { success: boolean; error?: string } | undefined;

    await act(async () => {
      loginResult = await result.current.login({
        login: "admin_user",
        password: "SenhaSegura123",
        role: "admin",
      });
    });

    expect(loginResult).toEqual({ success: true });
    expect(mocks.pushMock).toHaveBeenCalledWith("/admin/dashboard");
    expect(result.current.user?.role).toBe("admin");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/auth/csrf");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("/api/auth/login");
  });
});
