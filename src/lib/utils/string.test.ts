import { describe, expect, it } from "vitest";
import { resolveDisplayName } from "./string";

describe("resolveDisplayName", () => {
  it("returns socialName when filled", () => {
    expect(resolveDisplayName({ name: "João Silva", socialName: "Joana Silva" })).toBe(
      "Joana Silva",
    );
  });

  it("trims socialName before returning it", () => {
    expect(
      resolveDisplayName({ name: "João Silva", socialName: "  Joana Silva  " }),
    ).toBe("Joana Silva");
  });

  it("falls back to name when socialName is undefined", () => {
    expect(resolveDisplayName({ name: "João Silva", socialName: undefined })).toBe(
      "João Silva",
    );
  });

  it("falls back to name when socialName is null", () => {
    expect(resolveDisplayName({ name: "João Silva", socialName: null })).toBe(
      "João Silva",
    );
  });

  it("falls back to name when socialName is only whitespace", () => {
    expect(resolveDisplayName({ name: "João Silva", socialName: "   " })).toBe(
      "João Silva",
    );
  });
});
