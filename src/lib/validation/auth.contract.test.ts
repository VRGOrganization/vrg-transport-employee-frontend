import { describe, expect, it } from "vitest";
import {
  employeeAuthResponseSchema,
  employeeLoginRequestSchema,
} from "@/lib/validation/auth";

describe("contratos auth (employee frontend)", () => {
  it("deve aceitar payload de sessao valido", () => {
    const parsed = employeeAuthResponseSchema.parse({
      ok: true,
      user: {
        id: "507f1f77bcf86cd799439011",
        name: "Admin",
        identifier: "admin",
        role: "admin",
      },
    });

    expect(parsed.user.role).toBe("admin");
  });

  it("deve rejeitar request de login sem role", () => {
    expect(() =>
      employeeLoginRequestSchema.parse({
        login: "MAT123456",
        password: "Senha123",
      }),
    ).toThrow();
  });
});
