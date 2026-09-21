import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimitMock,
}));

vi.mock("@/lib/server/bff-auth", () => ({
  getBackendApiBaseUrl: () => "http://backend.local/api/v1",
  getServiceSecret: () => "service-secret-test",
}));

import { POST } from "./route";

const GENERIC =
  "Se o email estiver cadastrado, você receberá um link de recuperação em breve.";

const fetchMock = vi.fn<typeof fetch>();

function makeRequest(
  body: unknown,
  headers: Record<string, string> = { "x-forwarded-for": "198.51.100.7" },
): NextRequest {
  return new NextRequest("http://localhost:3002/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function upstream(status: number, body: unknown = {}, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function upstreamHeaders(): Record<string, string> {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
  return (init?.headers ?? {}) as Record<string, string>;
}

function connectivityError(code: string): TypeError {
  const error = new TypeError("fetch failed");
  (error as unknown as { cause: { code: string } }).cause = { code };
  return error;
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    mocks.checkRateLimitMock.mockReturnValue(true);
    fetchMock.mockResolvedValue(upstream(200, { message: GENERIC }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retorna 429 quando o rate limit local é excedido", async () => {
    mocks.checkRateLimitMock.mockReturnValue(false);

    const response = await POST(makeRequest({ email: "func@test.com" }));

    expect(response.status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retorna 400 para email inválido", async () => {
    const response = await POST(makeRequest({ email: "nao-e-email" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retorna a mensagem genérica no caminho feliz", async () => {
    const response = await POST(makeRequest({ email: "func@test.com" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: GENERIC });
  });

  // O bug: o resultado do fetch nem era atribuído, então um 429 do backend
  // virava 200 e o modal mostrava "Email enviado!".
  describe("429 do backend chega ao usuário", () => {
    it("repassa o 429 com a mensagem do backend", async () => {
      fetchMock.mockResolvedValue(
        upstream(
          429,
          { message: "Muitas tentativas. Tente novamente em 12 minutos." },
          { "retry-after": "720" },
        ),
      );

      const response = await POST(makeRequest({ email: "func@test.com" }));

      expect(response.status).toBe(429);
      await expect(response.json()).resolves.toEqual({
        message: "Muitas tentativas. Tente novamente em 12 minutos.",
      });
    });

    it("repassa o header Retry-After", async () => {
      fetchMock.mockResolvedValue(
        upstream(429, { message: "Muitas tentativas." }, { "retry-after": "720" }),
      );

      const response = await POST(makeRequest({ email: "func@test.com" }));

      expect(response.headers.get("retry-after")).toBe("720");
    });

    it("usa uma mensagem padrão quando o backend não manda uma", async () => {
      fetchMock.mockResolvedValue(upstream(429, {}));

      const response = await POST(makeRequest({ email: "func@test.com" }));
      const body = (await response.json()) as { message: string };

      expect(response.status).toBe(429);
      expect(body.message).toMatch(/tentativas/i);
    });
  });

  describe("demais erros seguem mascarados", () => {
    it("upstream 500 ainda devolve 200 genérico, e loga", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      fetchMock.mockResolvedValue(upstream(500, { message: "boom" }));

      const response = await POST(makeRequest({ email: "func@test.com" }));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ message: GENERIC });
      expect(errorSpy).toHaveBeenCalled();
    });

    it("upstream 404 ainda devolve 200 genérico", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      fetchMock.mockResolvedValue(upstream(404, {}));

      const response = await POST(makeRequest({ email: "func@test.com" }));

      expect(response.status).toBe(200);
    });

    it("mantém o 503 para erro de conectividade", async () => {
      fetchMock.mockRejectedValue(connectivityError("ECONNREFUSED"));

      const response = await POST(makeRequest({ email: "func@test.com" }));

      expect(response.status).toBe(503);
    });
  });

  describe("repasse do IP do cliente", () => {
    it("manda x-forwarded-for com o IP do cliente", async () => {
      await POST(makeRequest({ email: "func@test.com" }));

      expect(upstreamHeaders()["x-forwarded-for"]).toBe("198.51.100.7");
    });

    it("usa o primeiro IP da cadeia quando há vários", async () => {
      await POST(
        makeRequest(
          { email: "func@test.com" },
          { "x-forwarded-for": "198.51.100.7, 10.0.0.1" },
        ),
      );

      expect(upstreamHeaders()["x-forwarded-for"]).toBe("198.51.100.7");
    });

    it("não manda o header quando o IP é desconhecido", async () => {
      await POST(makeRequest({ email: "func@test.com" }, {}));

      expect(upstreamHeaders()["x-forwarded-for"]).toBeUndefined();
    });

    it("mantém o service secret", async () => {
      await POST(makeRequest({ email: "func@test.com" }));

      expect(upstreamHeaders()["x-service-secret"]).toBe("service-secret-test");
    });
  });
});
