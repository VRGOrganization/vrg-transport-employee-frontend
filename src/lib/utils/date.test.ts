import { describe, expect, it } from "vitest";

import {
  brDayEndISO,
  brDayStartISO,
  formatDateBR,
  toCivilBR,
  todayCivilBR,
} from "./date";

describe("helpers de data no fuso de Brasília", () => {
  it("brDayStartISO grava a meia-noite de Brasília, não a de UTC", () => {
    // 00:00 BRT (UTC-3) === 03:00Z do mesmo dia.
    expect(brDayStartISO("2030-08-21")).toBe("2030-08-21T03:00:00.000Z");
  });

  it("brDayEndISO grava o fim do dia de Brasília (já dia seguinte em UTC)", () => {
    expect(brDayEndISO("2030-08-21")).toBe("2030-08-22T02:59:59.999Z");
  });

  it("ida e volta preserva o dia escolhido — o bug do 'volta um dia'", () => {
    expect(toCivilBR(brDayStartISO("2030-08-21"))).toBe("2030-08-21");
    expect(toCivilBR(brDayEndISO("2030-08-21"))).toBe("2030-08-21");
  });

  it("formatDateBR renderiza no fuso de Brasília", () => {
    expect(formatDateBR(brDayStartISO("2030-08-21"))).toBe("21/08/2030");
    expect(formatDateBR(brDayEndISO("2030-08-21"))).toBe("21/08/2030");
  });

  it("tolera valores vazios ou inválidos", () => {
    expect(toCivilBR(null)).toBe("");
    expect(toCivilBR(undefined)).toBe("");
    expect(toCivilBR("not-a-date")).toBe("");
    expect(brDayStartISO("")).toBe("");
  });

  it("todayCivilBR devolve YYYY-MM-DD", () => {
    expect(todayCivilBR()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
