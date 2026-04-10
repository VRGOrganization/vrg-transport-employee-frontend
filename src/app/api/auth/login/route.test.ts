import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  validateCsrfTokenMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
}));

vi.mock("@/lib/server/csrf", () => ({
  validateCsrfToken: mocks.validateCsrfTokenMock,
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimitMock,
}));

vi.mock("@/lib/server/bff-auth", () => ({
  SID_COOKIE_NAME: "_atk",
  ROLE_COOKIE_NAME: "_atk_role",
  getBackendApiBaseUrl: () => "http://backend.local/api/v1",
  getServiceSecret: () => "service-secret-test",
  getSidMaxAgeSeconds: () => 3600,
}));

import { POST } from "./route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3002/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    mocks.checkRateLimitMock.mockReturnValue(true);
    mocks.validateCsrfTokenMock.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve bloquear quando limite de tentativas e excedido", async () => {
    mocks.checkRateLimitMock.mockReturnValue(false);

    const response = await POST(
      makeRequest({ login: "MAT123", password: "Senha123", role: "employee" }),
    );

    expect(response.status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deve retornar 403 quando CSRF e invalido", async () => {
    mocks.validateCsrfTokenMock.mockResolvedValue(false);

    const response = await POST(
      makeRequest({ login: "MAT123", password: "Senha123", role: "employee" }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 para payload invalido", async () => {
    const response = await POST(makeRequest({ login: "@", password: "1", role: "invalid" }));
    const body = (await response.json()) as { message?: string; errors?: Record<string, string> };

    expect(response.status).toBe(400);
    expect(body.message).toBeTruthy();
    expect(body.errors).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deve retornar 502 quando contrato de sessao do backend e invalido", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(
      makeRequest({ login: "MAT123", password: "Senha123", role: "employee" }),
    );

    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deve mapear credencial admin com username e definir cookies de sessao", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          sessionId: "507f1f77bcf86cd799439011",
          user: {
            id: "507f1f77bcf86cd799439011",
            role: "admin",
            identifier: "ADM001",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await POST(
      makeRequest({ login: "admin_user", password: "SenhaSegura123", role: "admin" }),
    );
    const body = (await response.json()) as {
      ok: boolean;
      user: { role: string; name: string };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.user.role).toBe("admin");
    expect(body.user.name).toBe("Administrador");

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const sentBody = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    expect(sentBody).toEqual({ username: "admin_user", password: "SenhaSegura123" });

    expect(response.cookies.get("_atk")?.value).toBe("507f1f77bcf86cd799439011");
    expect(response.cookies.get("_atk_role")?.value).toBe("admin");
  });
});
