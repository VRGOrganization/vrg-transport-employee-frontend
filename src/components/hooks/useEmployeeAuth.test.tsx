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

function installLocalStorageMock(): Storage {
  const data = new Map<string, string>();
  const storage = {
    get length() {
      return data.size;
    },
    clear: vi.fn(() => data.clear()),
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(data.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => data.delete(key)),
    setItem: vi.fn((key: string, value: string) => data.set(key, String(value))),
  } as Storage;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  vi.stubGlobal("localStorage", storage);
  return storage;
}

describe("useEmployeeAuth", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    installLocalStorageMock();
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
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

  it("deve manter usuario do snapshot quando /session falha por rede", async () => {
    window.localStorage.setItem(
      "vrg:employee-auth-snapshot",
      JSON.stringify({
        user: {
          id: "507f1f77bcf86cd799439011",
          role: "employee",
          identifier: "MAT123",
          name: "Funcionario Teste",
        },
        expiresAt: Date.now() + 60_000,
      }),
    );
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const { result } = renderHook(() => useEmployeeAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user?.identifier).toBe("MAT123");
    expect(mocks.pushMock).not.toHaveBeenCalledWith("/login");
  });

  it("deve apagar snapshot em 401 real", async () => {
    window.localStorage.setItem(
      "vrg:employee-auth-snapshot",
      JSON.stringify({
        user: {
          id: "507f1f77bcf86cd799439011",
          role: "employee",
          identifier: "MAT123",
          name: "Funcionario Teste",
        },
        expiresAt: Date.now() + 60_000,
      }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Sessao invalida" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const { result } = renderHook(() => useEmployeeAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(window.localStorage.getItem("vrg:employee-auth-snapshot")).toBeNull();
  });

  // Fix #04: ensureCsrf é o que alimenta o header CSRF das chamadas de
  // negócio via services/http.ts — sem isso, o proxy (agora validando
  // CSRF) rejeitaria toda ação mutante do app de funcionário.
  describe("ensureCsrf (fix #04)", () => {
    it("configureEmployeeApi recebe uma funcao ensureCsrf", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Sessao nao encontrada" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

      renderHook(() => useEmployeeAuth());

      await waitFor(() => {
        expect(mocks.configureEmployeeApiMock).toHaveBeenCalled();
      });

      const call = mocks.configureEmployeeApiMock.mock.calls[0][0];
      expect(typeof call.ensureCsrf).toBe("function");
    });

    it("ensureCsrf busca /api/auth/session e retorna o par csrf; cacheia sem forceRefresh", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Sessao nao encontrada" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

      const { result } = renderHook(() => useEmployeeAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const ensureCsrf = mocks.configureEmployeeApiMock.mock.calls[0][0]
        .ensureCsrf as (forceRefresh?: boolean) => Promise<unknown>;

      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Sessao nao encontrada",
            csrf: { headerName: "x-csrf-token", token: "tok-a" },
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      );

      const first = await ensureCsrf();
      expect(first).toEqual({ headerName: "x-csrf-token", token: "tok-a" });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const second = await ensureCsrf();
      expect(second).toEqual({ headerName: "x-csrf-token", token: "tok-a" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("ensureCsrf(true) refaz o fetch e substitui o token cacheado", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Sessao nao encontrada",
            csrf: { headerName: "x-csrf-token", token: "tok-a" },
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      );

      const { result } = renderHook(() => useEmployeeAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const ensureCsrf = mocks.configureEmployeeApiMock.mock.calls[0][0]
        .ensureCsrf as (forceRefresh?: boolean) => Promise<unknown>;

      await ensureCsrf();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            csrf: { headerName: "x-csrf-token", token: "tok-b" },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

      const refreshed = await ensureCsrf(true);
      expect(refreshed).toEqual({ headerName: "x-csrf-token", token: "tok-b" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
