import { describe, expect, it } from "vitest";
import { normalizePersonName, personNameSchema } from "./personName";

const schema = personNameSchema("Nome");

describe("personNameSchema", () => {
  it.each(["João da Silva", "D'Ávila", "Ana-Maria Souza"])(
    "aceita %s",
    (name) => {
      expect(schema.safeParse(name).success).toBe(true);
    },
  );

  it.each(["", "Maria 2", "maria_silva", "Maria@Silva"])(
    "recusa %s",
    (name) => {
      expect(schema.safeParse(name).success).toBe(false);
    },
  );

  it("explica quais caracteres o nome aceita", () => {
    const result = schema.safeParse("Maria 2");
    expect(result.error?.issues[0]?.message).toBe(
      "Use apenas letras, espaços, apóstrofo, ponto e hífen.",
    );
  });

  it("normaliza apóstrofo, hífen e espaços antes de validar", () => {
    expect(schema.parse("  Ana–Maria   D’Avila ")).toBe(
      "Ana-Maria D'Avila",
    );
  });
});

describe("normalizePersonName", () => {
  it("compõe acentos decompostos", () => {
    expect(normalizePersonName("José")).toBe("José");
  });
});
