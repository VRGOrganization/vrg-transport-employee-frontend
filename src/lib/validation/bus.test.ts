import { describe, expect, it } from "vitest";
import { busFormSchema } from "@/lib/validation/bus";

const valid = { identifier: "01", capacity: "48", shift: "Manhã" };

function fieldErrors(values: Record<string, string>) {
  const result = busFormSchema.safeParse(values);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe("busFormSchema", () => {
  it("aceita ônibus com identificador, capacidade e turno válidos", () => {
    expect(busFormSchema.safeParse(valid).success).toBe(true);
    expect(busFormSchema.safeParse({ ...valid, shift: "Noite" }).success).toBe(true);
  });

  it("aceita capacidade mínima de 1 vaga", () => {
    expect(busFormSchema.safeParse({ ...valid, capacity: "1" }).success).toBe(true);
  });

  it.each(["", "   ", "0", "-3", "1.5", "3abc", "abc"])(
    "rejeita capacidade %j",
    (capacity) => {
      expect(fieldErrors({ ...valid, capacity }).capacity).toEqual([
        "Informe a capacidade: um número inteiro de pelo menos 1 vaga.",
      ]);
    },
  );

  it.each(["", "Tarde", "Integral"])("rejeita turno %j", (shift) => {
    expect(fieldErrors({ ...valid, shift }).shift).toEqual([
      "Selecione o turno do ônibus: Manhã ou Noite.",
    ]);
  });
});
