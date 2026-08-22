import { describe, expect, it } from "vitest";

import {
  busMatchesShift,
  filterScheduleByShift,
  isFullTimeShift,
  isPeriodAllowedForShift,
  normalizeShift,
} from "./shiftRules";

describe("normalizeShift", () => {
  it("ignora acento, caixa e espaços", () => {
    expect(normalizeShift("  MANHÃ ")).toBe("manha");
    expect(normalizeShift("manha")).toBe(normalizeShift("Manhã"));
  });

  it("trata vazio/nulo como string vazia", () => {
    expect(normalizeShift(null)).toBe("");
    expect(normalizeShift(undefined)).toBe("");
  });
});

describe("isPeriodAllowedForShift", () => {
  it("bloqueia tudo enquanto não houver turno", () => {
    for (const period of ["Manhã", "Tarde", "Noite"]) {
      expect(isPeriodAllowedForShift(period, "")).toBe(false);
    }
  });

  it("permite apenas o período igual ao turno", () => {
    expect(isPeriodAllowedForShift("Manhã", "Manhã")).toBe(true);
    expect(isPeriodAllowedForShift("Noite", "Manhã")).toBe(false);
    expect(isPeriodAllowedForShift("Manhã", "Noite")).toBe(false);
  });

  it("Integral libera todos os períodos", () => {
    expect(isFullTimeShift("Integral")).toBe(true);
    for (const period of ["Manhã", "Tarde", "Noite"]) {
      expect(isPeriodAllowedForShift(period, "Integral")).toBe(true);
    }
  });
});

describe("filterScheduleByShift", () => {
  it("remove horários fora do turno escolhido", () => {
    const schedule = [
      { day: "SEG", period: "Manhã" },
      { day: "TER", period: "Noite" },
    ];

    expect(filterScheduleByShift(schedule, "Manhã")).toEqual([
      { day: "SEG", period: "Manhã" },
    ]);
  });

  it("mantém tudo no turno Integral e zera sem turno", () => {
    const schedule = [
      { day: "SEG", period: "Manhã" },
      { day: "TER", period: "Noite" },
    ];

    expect(filterScheduleByShift(schedule, "Integral")).toHaveLength(2);
    expect(filterScheduleByShift(schedule, "")).toHaveLength(0);
  });
});

describe("busMatchesShift", () => {
  it("filtra ônibus pelo turno", () => {
    expect(busMatchesShift({ shift: "Manhã" }, "Manhã")).toBe(true);
    expect(busMatchesShift({ shift: "Noite" }, "Manhã")).toBe(false);
  });

  it("compara turnos com acentuação/caixa diferentes", () => {
    expect(busMatchesShift({ shift: "manha" }, "Manhã")).toBe(true);
  });

  it("Integral aceita qualquer ônibus", () => {
    expect(busMatchesShift({ shift: "Noite" }, "Integral")).toBe(true);
  });

  it("ônibus sem turno definido nunca é escondido", () => {
    expect(busMatchesShift({ shift: null }, "Manhã")).toBe(true);
    expect(busMatchesShift({ shift: undefined }, "Noite")).toBe(true);
  });
});
