import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server/bff-auth", () => ({
  SID_COOKIE_NAME: "_atk",
  ROLE_COOKIE_NAME: "_atk_role",
  getBackendApiBaseUrl: () => "http://backend.local/api/v1",
  getServiceSecret: () => "service-secret-test",
}));

import { GET } from "./route";

function makeRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost:3002/api/auth/session", {
    method: "GET",
    headers: cookie ? { cookie } : {},
  });
}

describe("GET /api/auth/session", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve retornar 401 quando nao existe cookie de sessao", async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deve limpar cookies quando sessao no backend e invalida", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "invalid" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(makeRequest("_atk=session-abc"));

    expect(response.status).toBe(401);
    expect(response.cookies.get("_atk")?.value).toBe("");
    expect(response.cookies.get("_atk_role")?.value).toBe("");
  });

  it("deve retornar 403 para tipo de usuario fora do frontend", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          userId: "507f1f77bcf86cd799439011",
          userType: "student",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await GET(makeRequest("_atk=session-abc"));

    expect(response.status).toBe(403);
  });

  it("deve retornar sessao valida e nome vindo do endpoint de detalhe", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            userId: "507f1f77bcf86cd799439011",
            userType: "employee",
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
            name: "Funcionario Nomeado",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const response = await GET(makeRequest("_atk=session-abc"));
    const body = (await response.json()) as {
      ok: boolean;
      user: { id: string; role: string; name: string };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.user.id).toBe("507f1f77bcf86cd799439011");
    expect(body.user.role).toBe("employee");
    expect(body.user.name).toBe("Funcionario Nomeado");
    expect(response.cookies.get("_atk_role")?.value).toBe("employee");
  });
});
