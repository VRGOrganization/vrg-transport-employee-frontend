import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { employeeAuthResponseSchema } from "@/lib/validation/auth";

describe("contrato de sessao via MSW (employee frontend)", () => {
  it("deve validar resposta de sessao com schema Zod", async () => {
    server.use(
      http.get("/api/auth/session", () => {
        return HttpResponse.json(
          employeeAuthResponseSchema.parse({
            ok: true,
            user: {
              id: "507f1f77bcf86cd799439011",
              role: "employee",
              identifier: "MAT123456",
              name: "Funcionario",
            },
          }),
          { status: 200 },
        );
      }),
    );

    const res = await fetch("/api/auth/session");
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(() => employeeAuthResponseSchema.parse(payload)).not.toThrow();
  });
});
