import { describe, expect, it } from "vitest";
import { buildReadout, contextLabelsFromLens } from "../readout";
import { gridByDayPeriod } from "../selectors";
import { EMPTY_LENS, type CycleFunnel, type InfoLens, type Seat } from "@/types/info.types";

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

function funnel(over: Partial<CycleFunnel> = {}): CycleFunnel {
  return {
    requests: 0,
    approved: 0,
    licenses: 0,
    waitlisted: 0,
    pending: 0,
    revisionPendingStudent: 0,
    revisionResubmitted: 0,
    ...over,
  };
}

function lens(over: Partial<InfoLens> = {}): InfoLens {
  return { ...EMPTY_LENS, ...over };
}

function text(tokens: ReturnType<typeof buildReadout>): string {
  return tokens.map((t) => t.text).join("");
}

describe("buildReadout", () => {
  it("escreve a situação geral do ciclo", () => {
    const out = buildReadout({
      lens: lens(),
      grid: gridByDayPeriod([], "pessoas"),
      funnel: funnel({ licenses: 1107 }),
      studentsActive: 1284,
      peopleInLens: 0,
      busesInLens: 0,
      contextLabels: [],
    });

    expect(text(out)).toContain("1.284 alunos ativos");
    expect(text(out)).toContain("1.107 carteirinhas emitidas");
  });

  it("não inventa zero quando não há pendências", () => {
    const out = text(
      buildReadout({
        lens: lens(),
        grid: gridByDayPeriod([], "pessoas"),
        funnel: funnel({ licenses: 12 }),
        studentsActive: 15,
        peopleInLens: 0,
        busesInLens: 0,
        contextLabels: [],
      }),
    );

    // A frase ENCURTA em vez de dizer "0 solicitações".
    expect(out).not.toContain("aguardam análise");
    expect(out).not.toContain("lista de espera");
    expect(out).not.toMatch(/\b0\b/);
  });

  it("cita pendências e lista de espera quando existem", () => {
    const out = text(
      buildReadout({
        lens: lens(),
        grid: gridByDayPeriod([], "pessoas"),
        funnel: funnel({ licenses: 5, pending: 63, waitlisted: 28 }),
        studentsActive: 100,
        peopleInLens: 0,
        busesInLens: 0,
        contextLabels: [],
      }),
    );

    expect(out).toContain("63 solicitações aguardam análise");
    expect(out).toContain("28 estão na lista de espera");
  });

  it("usa singular correto", () => {
    const out = text(
      buildReadout({
        lens: lens(),
        grid: gridByDayPeriod([], "pessoas"),
        funnel: funnel({ licenses: 1, pending: 1, waitlisted: 1 }),
        studentsActive: 1,
        peopleInLens: 0,
        busesInLens: 0,
        contextLabels: [],
      }),
    );

    expect(out).toContain("1 aluno ativo");
    expect(out).toContain("1 carteirinha emitida");
    expect(out).toContain("1 solicitação aguarda análise");
    expect(out).toContain("1 está na lista de espera");
  });

  it("anuncia pico e vale da semana", () => {
    const seats = [
      seat({ studentId: "a", day: "QUA", period: "Noite" }),
      seat({ studentId: "b", day: "QUA", period: "Noite" }),
      seat({ studentId: "c", day: "SEX", period: "Manhã" }),
    ];

    const out = text(
      buildReadout({
        lens: lens(),
        grid: gridByDayPeriod(seats, "pessoas"),
        funnel: funnel(),
        studentsActive: 3,
        peopleInLens: 3,
        busesInLens: 1,
        contextLabels: [],
      }),
    );

    expect(out).toContain("O pico da semana é quarta à noite");
    expect(out).toContain("o vale é sexta de manhã");
  });

  it("omite o vale quando ele coincide com o pico", () => {
    const seats = [seat({ day: "QUA", period: "Noite" })];

    const out = text(
      buildReadout({
        lens: lens(),
        grid: gridByDayPeriod(seats, "pessoas"),
        funnel: funnel(),
        studentsActive: 1,
        peopleInLens: 1,
        busesInLens: 1,
        contextLabels: [],
      }),
    );

    expect(out).toContain("O pico da semana");
    expect(out).not.toContain("o vale");
  });

  it("reescreve a frase para o recorte ativo", () => {
    const seats = [seat(), seat({ studentId: "s2" })];

    const out = text(
      buildReadout({
        lens: lens({ universityId: "uni-1", period: "Noite" }),
        grid: gridByDayPeriod(seats, "pessoas"),
        funnel: funnel({ licenses: 500 }),
        studentsActive: 900,
        peopleInLens: 2,
        busesInLens: 1,
        contextLabels: ["UNIFLU", "à noite"],
      }),
    );

    expect(out).toContain("Em UNIFLU, à noite");
    expect(out).toContain("2 alunos viajam");
    // No recorte, o total geral do sistema não aparece.
    expect(out).not.toContain("900");
  });

  it("marca os números como clicáveis com o recorte correspondente", () => {
    const seats = [seat({ day: "QUI", period: "Tarde" })];

    const tokens = buildReadout({
      lens: lens(),
      grid: gridByDayPeriod(seats, "pessoas"),
      funnel: funnel(),
      studentsActive: 1,
      peopleInLens: 1,
      busesInLens: 1,
      contextLabels: [],
    });

    const clickable = tokens.find((t) => t.lens);
    expect(clickable?.lens).toEqual({ day: "QUI", period: "Tarde" });
  });
});

describe("contextLabelsFromLens", () => {
  it("junta os rótulos dos filtros ativos em português", () => {
    const labels = contextLabelsFromLens(
      lens({ universityId: "u", busId: "b", shift: "Noite", day: "QUA", period: "Noite" }),
      { university: "UNIFLU", bus: "Ônibus 07" },
    );

    expect(labels).toEqual([
      "UNIFLU",
      "Ônibus 07",
      "turno da noite",
      "quarta à noite",
    ]);
  });

  it("descreve só o dia quando não há período", () => {
    const labels = contextLabelsFromLens(lens({ day: "SEX" }), {});

    expect(labels).toEqual(["sexta"]);
  });

  it("devolve lista vazia sem filtros", () => {
    expect(contextLabelsFromLens(lens(), {})).toEqual([]);
  });
});
