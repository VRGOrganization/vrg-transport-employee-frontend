import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PROXY_CSRF_ERROR_HEADER } from "@/lib/csrfProxyMarker";

vi.mock("@/lib/server/bff-auth", () => ({
  getBackendApiBaseUrl: () => "http://backend.local/api/v1",
  getServiceSecret: () => "secret-test",
  SID_COOKIE_NAME: "_atk",
}));

const validateCsrfTokenMock = vi.fn<() => Promise<boolean>>();
vi.mock("@/lib/server/csrf", () => ({
  validateCsrfToken: () => validateCsrfTokenMock(),
}));

const fetchMock = vi.fn<typeof fetch>();

// Fix #04 (achado #7): proxy genérico de negócio do employee-frontend não
// validava CSRF em nenhum método mutante — GET/POST/PATCH/PUT/DELETE eram
// todos encaminhados direto ao backend.
describe("proxy route GET/POST/PATCH (employee)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCsrfTokenMock.mockResolvedValue(true);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("repassa GET sem checar CSRF", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const { GET } = await import("./route");
    const request = new NextRequest(
      "http://localhost/api/v1/license-request?page=1",
      { method: "GET" },
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ["license-request"] }),
    });

    expect(response.status).toBe(200);
    expect(validateCsrfTokenMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bloqueia mutação com CSRF inválido (403) sem chamar o backend", async () => {
    validateCsrfTokenMock.mockResolvedValue(false);

    const { PATCH } = await import("./route");
    const request = new NextRequest(
      "http://localhost/api/v1/license-request/req-1/approve",
      {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ path: ["license-request", "req-1", "approve"] }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid CSRF token",
    });
    // Marcador estruturado (não a mensagem) que services/http.ts usa pra
    // decidir se é seguro reenviar — precisa estar presente aqui.
    expect(response.headers.get(PROXY_CSRF_ERROR_HEADER)).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repassa mutação com CSRF válido ao backend", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const { PATCH } = await import("./route");
    const request = new NextRequest(
      "http://localhost/api/v1/license-request/req-1/approve",
      {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ path: ["license-request", "req-1", "approve"] }),
    });

    expect(response.status).toBe(200);
    expect(validateCsrfTokenMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["POST", "PUT", "DELETE"] as const)(
    "bloqueia %s com CSRF inválido sem chamar o backend",
    async (method) => {
      validateCsrfTokenMock.mockResolvedValue(false);

      const routeModule = await import("./route");
      const handler = routeModule[method];
      const request = new NextRequest("http://localhost/api/v1/bus/bus-1", {
        method,
        body: method === "DELETE" ? undefined : JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });

      const response = await handler(request, {
        params: Promise.resolve({ path: ["bus", "bus-1"] }),
      });

      expect(response.status).toBe(403);
      expect(response.headers.get(PROXY_CSRF_ERROR_HEADER)).toBe("1");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("bloqueia rota /auth/* antes de checar CSRF", async () => {
    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost/api/v1/auth/login", {
      method: "POST",
      body: "{}",
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["auth", "login"] }),
    });

    expect(response.status).toBe(404);
    expect(validateCsrfTokenMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
