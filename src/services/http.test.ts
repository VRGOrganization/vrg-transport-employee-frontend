import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, configureHttp, http, resetHttpState } from "./http";
import { PROXY_CSRF_ERROR_HEADER } from "@/lib/csrfProxyMarker";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal("fetch", mockFetch);
  resetHttpState();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function okResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function errorResponse(
  status: number,
  body: unknown = { message: "Erro" },
  extraHeaders: Record<string, string> = {},
) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...extraHeaders },
    }),
  );
}

function proxyCsrfRejection() {
  return errorResponse(
    403,
    { message: "Invalid CSRF token" },
    { [PROXY_CSRF_ERROR_HEADER]: "1" },
  );
}

// Fix #04: services/http.ts (usado por aprovar/rejeitar carteirinha, banir
// aluno, editar ônibus, etc.) precisa anexar o header CSRF nas mutações,
// senão o proxy (agora validando) rejeita toda ação de negócio legítima.
describe("http (CSRF — fix #04)", () => {
  it("nao chama ensureCsrf em GET", async () => {
    const ensureCsrf = vi.fn().mockResolvedValue({
      headerName: "x-csrf-token",
      token: "tok-1",
    });
    configureHttp({ onUnauthorized: vi.fn(), ensureCsrf });
    mockFetch.mockReturnValue(okResponse({ ok: true }));

    await http.get("/recurso");

    expect(ensureCsrf).not.toHaveBeenCalled();
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["x-csrf-token"]).toBeUndefined();
  });

  it("anexa header CSRF em POST/PATCH/PUT/DELETE", async () => {
    const ensureCsrf = vi.fn().mockResolvedValue({
      headerName: "x-csrf-token",
      token: "tok-1",
    });
    configureHttp({ onUnauthorized: vi.fn(), ensureCsrf });
    mockFetch.mockReturnValue(okResponse({ ok: true }));

    await http.patch("/license-request/req-1/approve", {});

    expect(ensureCsrf).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/license-request/req-1/approve`);
    expect(opts.headers["x-csrf-token"]).toBe("tok-1");
  });

  it("sem ensureCsrf configurado, nao quebra e nao anexa header", async () => {
    mockFetch.mockReturnValue(okResponse({ ok: true }));

    await http.post("/banlist", { studentId: "stu-1" });

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["x-csrf-token"]).toBeUndefined();
  });

  it("renova o token uma vez e reenvia quando recebe 403 com marcador de origem-proxy", async () => {
    const ensureCsrf = vi
      .fn()
      .mockResolvedValueOnce({ headerName: "x-csrf-token", token: "expirado" })
      .mockResolvedValueOnce({ headerName: "x-csrf-token", token: "fresco" });
    configureHttp({ onUnauthorized: vi.fn(), ensureCsrf });

    mockFetch
      .mockReturnValueOnce(proxyCsrfRejection())
      .mockReturnValueOnce(okResponse({ ok: true }));

    const result = await http.patch("/bus/bus-1", { capacity: 40 });

    expect(result).toEqual({ ok: true });
    expect(ensureCsrf).toHaveBeenCalledTimes(2);
    expect(ensureCsrf).toHaveBeenNthCalledWith(2, true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, secondOpts] = mockFetch.mock.calls[1];
    expect(secondOpts.headers["x-csrf-token"]).toBe("fresco");
  });

  it("propaga erro se o 403 com marcador de origem-proxy persistir mesmo apos renovar o token", async () => {
    const ensureCsrf = vi.fn().mockResolvedValue({
      headerName: "x-csrf-token",
      token: "tok-1",
    });
    configureHttp({ onUnauthorized: vi.fn(), ensureCsrf });
    mockFetch.mockReturnValue(proxyCsrfRejection());

    await expect(http.delete("/bus/bus-1")).rejects.toMatchObject({
      status: 403,
      message: "Invalid CSRF token",
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // Fix #04 (revisão): 403 de negócio real (guard de role, ownership check
  // em cancel-scheduled-notice/delete-notice etc.) não tem o marcador de
  // origem-proxy — não pode disparar retry, porque presumir "é CSRF" só
  // pelo status arriscaria reenviar uma mutação que o backend rejeitou por
  // outro motivo.
  it("NÃO reenvia em 403 de negócio real (sem marcador de origem-proxy)", async () => {
    const ensureCsrf = vi.fn().mockResolvedValue({
      headerName: "x-csrf-token",
      token: "tok-1",
    });
    configureHttp({ onUnauthorized: vi.fn(), ensureCsrf });
    mockFetch.mockReturnValue(
      errorResponse(403, {
        message: "Você não tem permissão para excluir este aviso.",
      }),
    );

    await expect(http.delete("/notice/notice-1")).rejects.toMatchObject({
      status: 403,
      message: "Você não tem permissão para excluir este aviso.",
    });

    // 1 chamada de fetch (a inicial, com csrf já anexado) — nenhum reenvio.
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // ensureCsrf só foi chamado pra anexar o header na primeira tentativa,
    // nunca com forceRefresh (o que só acontece no retry).
    expect(ensureCsrf).toHaveBeenCalledTimes(1);
    expect(ensureCsrf).not.toHaveBeenCalledWith(true);
  });

  it("resetHttpState limpa ensureCsrf e onUnauthorized", async () => {
    const ensureCsrf = vi.fn().mockResolvedValue({
      headerName: "x-csrf-token",
      token: "tok-1",
    });
    configureHttp({ onUnauthorized: vi.fn(), ensureCsrf });
    resetHttpState();

    mockFetch.mockReturnValue(okResponse({ ok: true }));
    await http.post("/banlist", {});

    expect(ensureCsrf).not.toHaveBeenCalled();
  });
});
