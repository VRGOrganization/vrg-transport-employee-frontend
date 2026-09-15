import { describe, expect, it } from "vitest";
import {
  applyLens,
  clearFilters,
  hasActiveFilters,
  lensFromSearchParams,
  lensToSearchParams,
} from "../lens";
import { EMPTY_LENS, type InfoLens, type Seat } from "@/types/info.types";

function seat(over: Partial<Seat> = {}): Seat {
  return {
    studentId: "s1",
    requestId: "r1",
    cycleId: "cycle-1",
    universityId: "uni-1",
    courseKey: "engenharia",
    busId: "bus-1",
    busIdentifier: "Ônibus 01",
    day: "SEG",
    period: "Manhã",
    legs: 2,
    status: "active",
    shift: "Manhã",
    ...over,
  };
}

function lens(over: Partial<InfoLens> = {}): InfoLens {
  return { ...EMPTY_LENS, ...over };
}

const SEATS: Seat[] = [
  seat({ studentId: "s1" }),
  seat({ studentId: "s2", universityId: "uni-2" }),
  seat({ studentId: "s3", courseKey: "direito" }),
  seat({ studentId: "s4", busId: "bus-2" }),
  seat({ studentId: "s5", shift: "Noite" }),
  seat({ studentId: "s6", day: "QUI" }),
  seat({ studentId: "s7", period: "Noite" }),
];

describe("applyLens", () => {
  it("sem filtros, devolve tudo", () => {
    expect(applyLens(SEATS, lens())).toHaveLength(SEATS.length);
  });

  it("filtra por faculdade", () => {
    const out = applyLens(SEATS, lens({ universityId: "uni-2" }));
    expect(out.map((s) => s.studentId)).toEqual(["s2"]);
  });

  it("filtra por curso", () => {
    const out = applyLens(SEATS, lens({ courseKey: "direito" }));
    expect(out.map((s) => s.studentId)).toEqual(["s3"]);
  });

  it("filtra por ônibus", () => {
    const out = applyLens(SEATS, lens({ busId: "bus-2" }));
    expect(out.map((s) => s.studentId)).toEqual(["s4"]);
  });

  it("filtra por turno declarado do aluno", () => {
    const out = applyLens(SEATS, lens({ shift: "Noite" }));
    expect(out.map((s) => s.studentId)).toEqual(["s5"]);
  });

  it("filtra por dia", () => {
    const out = applyLens(SEATS, lens({ day: "QUI" }));
    expect(out.map((s) => s.studentId)).toEqual(["s6"]);
  });

  it("filtra por período da viagem", () => {
    const out = applyLens(SEATS, lens({ period: "Noite" }));
    expect(out.map((s) => s.studentId)).toEqual(["s7"]);
  });

  it("distingue turno declarado de período da viagem", () => {
    // s5 tem shift Noite mas viaja de Manhã; s7 viaja à Noite com shift Manhã.
    expect(applyLens(SEATS, lens({ shift: "Noite" }))[0].period).toBe("Manhã");
    expect(applyLens(SEATS, lens({ period: "Noite" }))[0].shift).toBe("Manhã");
  });

  it("combina todos os filtros", () => {
    const seats = [
      seat({ studentId: "alvo", universityId: "uni-9", courseKey: "medicina", busId: "bus-9", shift: "Tarde", day: "QUA", period: "Tarde" }),
      seat({ studentId: "quase", universityId: "uni-9", courseKey: "medicina", busId: "bus-9", shift: "Tarde", day: "QUA", period: "Noite" }),
    ];

    const out = applyLens(
      seats,
      lens({ universityId: "uni-9", courseKey: "medicina", busId: "bus-9", shift: "Tarde", day: "QUA", period: "Tarde" }),
    );

    expect(out.map((s) => s.studentId)).toEqual(["alvo"]);
  });
});

describe("hasActiveFilters", () => {
  it("ciclo não conta como recorte", () => {
    expect(hasActiveFilters(lens({ cycleId: "c1" }))).toBe(false);
  });

  it("qualquer recorte de dado conta", () => {
    expect(hasActiveFilters(lens({ day: "SEG" }))).toBe(true);
    expect(hasActiveFilters(lens({ universityId: "uni-1" }))).toBe(true);
  });
});

describe("serialização na URL", () => {
  it("faz round-trip completo da lente", () => {
    const original = lens({
      cycleId: "c1",
      universityId: "uni-1",
      courseKey: "engenharia de producao",
      busId: "bus-1",
      shift: "Noite",
      day: "QUA",
      period: "Tarde",
    });

    const restored = lensFromSearchParams(lensToSearchParams(original));

    expect(restored).toEqual(original);
  });

  it("omite valores padrão da URL", () => {
    const params = lensToSearchParams(lens());

    expect(params.toString()).toBe("");
  });

  it("descarta valores inválidos em vez de quebrar", () => {
    const params = new URLSearchParams({
      day: "DOM",
      period: "Madrugada",
      shift: "Integral",
    });

    const restored = lensFromSearchParams(params);

    expect(restored.day).toBeNull();
    expect(restored.period).toBeNull();
    // Integral não é um período de viagem.
    expect(restored.shift).toBeNull();
  });
});

describe("clearFilters", () => {
  it("limpa os recortes preservando o ciclo", () => {
    const out = clearFilters(
      lens({ cycleId: "c1", day: "SEG", universityId: "uni-1" }),
    );

    expect(out).toEqual(lens({ cycleId: "c1" }));
  });
});
