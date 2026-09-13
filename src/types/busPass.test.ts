import { describe, expect, it } from "vitest";

import {
  BUS_PASS_STATUS_LABELS,
  formatCivilDate,
  todayInBR,
  weekdayLabel,
} from "./busPass";

describe("formatCivilDate", () => {
  it("converte YYYY-MM-DD em DD/MM/AAAA", () => {
    expect(formatCivilDate("2026-08-12")).toBe("12/08/2026");
  });

  it("não desloca o dia pelo fuso do navegador", () => {
    // `new Date('2026-08-12')` seria meia-noite UTC e, em Brasília (GMT-3),
    // renderizaria 11/08. A conversão por split existe por causa disso.
    expect(formatCivilDate("2026-08-12")).toBe("12/08/2026");
    expect(formatCivilDate("2026-01-01")).toBe("01/01/2026");
    expect(formatCivilDate("2026-12-31")).toBe("31/12/2026");
  });
});

describe("todayInBR", () => {
  it("devolve uma data civil válida", () => {
    expect(todayInBR()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("weekdayLabel", () => {
  it("traduz dias úteis e passa adiante o desconhecido", () => {
    expect(weekdayLabel("QUA")).toBe("Quarta");
    expect(weekdayLabel("DOM")).toBe("DOM");
  });
});

describe("BUS_PASS_STATUS_LABELS", () => {
  it("tem rótulo para todo status", () => {
    for (const status of [
      "pending",
      "revision",
      "approved",
      "rejected",
      "cancelled",
      "expired",
    ] as const) {
      expect(BUS_PASS_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
