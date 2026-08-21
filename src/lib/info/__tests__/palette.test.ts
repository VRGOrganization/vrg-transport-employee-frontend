import { describe, expect, it } from "vitest";
import { busLabel, createBusPalette, PERIOD_COLOR_VAR } from "../palette";
import { UNKNOWN_BUS_KEY } from "@/types/info.types";

const BUSES = [
  { _id: "b2", identifier: "Ônibus 02" },
  { _id: "b10", identifier: "Ônibus 10" },
  { _id: "b1", identifier: "Ônibus 01" },
];

describe("createBusPalette", () => {
  it("dá a mesma cor para a mesma entrada entre chamadas", () => {
    const a = createBusPalette(BUSES, false);
    const b = createBusPalette(BUSES, false);

    expect(a.color("b1")).toBe(b.color("b1"));
    expect(a.color("b10")).toBe(b.color("b10"));
  });

  it("é estável quando a lista chega em outra ordem", () => {
    const original = createBusPalette(BUSES, false);
    const shuffled = createBusPalette([...BUSES].reverse(), false);

    for (const { _id } of BUSES) {
      expect(shuffled.color(_id)).toBe(original.color(_id));
    }
  });

  it("ordena por identificador com consciência numérica", () => {
    const palette = createBusPalette(BUSES, false);

    // "Ônibus 02" vem antes de "Ônibus 10" — ordenação numérica, não textual.
    expect(palette.index("b1")).toBe(0);
    expect(palette.index("b2")).toBe(1);
    expect(palette.index("b10")).toBe(2);
  });

  it("dá cores distintas a ônibus distintos", () => {
    const palette = createBusPalette(BUSES, false);
    const colors = new Set(BUSES.map((b) => palette.color(b._id)));

    expect(colors.size).toBe(BUSES.length);
  });

  it("usa cinza neutro para ônibus não identificado", () => {
    const palette = createBusPalette(BUSES, false);

    expect(palette.color(null)).toBe("var(--color-outline)");
    expect(palette.color("desconhecido")).toBe("var(--color-outline)");
    expect(palette.index(null)).toBe(-1);
  });

  it("muda a luminosidade conforme o tema", () => {
    const light = createBusPalette(BUSES, false);
    const dark = createBusPalette(BUSES, true);

    expect(light.color("b1")).not.toBe(dark.color("b1"));
    expect(light.color("b1")).toContain("45%");
    expect(dark.color("b1")).toContain("62%");
  });

  it("escolhe texto legível conforme a luminosidade do tema", () => {
    expect(createBusPalette(BUSES, false).readableOn("b1")).toBe("#ffffff");
    expect(createBusPalette(BUSES, true).readableOn("b1")).toBe("#101418");
  });
});

describe("PERIOD_COLOR_VAR", () => {
  it("mapeia cada turno para um token, sem cor solta", () => {
    expect(Object.values(PERIOD_COLOR_VAR).every((v) => v.startsWith("var(--color-"))).toBe(true);
  });
});

describe("busLabel", () => {
  it("traduz o balde de não identificado", () => {
    expect(busLabel(UNKNOWN_BUS_KEY)).toBe("Ônibus não identificado");
    expect(busLabel("Ônibus 07")).toBe("Ônibus 07");
  });
});
