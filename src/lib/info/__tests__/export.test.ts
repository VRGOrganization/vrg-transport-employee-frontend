import { describe, expect, it } from "vitest";
import { buildInfoCsv, buildInfoJson, type InfoExportView } from "../export";
import { gridByDayPeriod, gridTotals } from "../selectors";
import { EMPTY_LENS, type Seat } from "@/types/info.types";

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

function makeView(over: Partial<InfoExportView> = {}): InfoExportView {
  const seats = [seat(), seat({ studentId: "s2", day: "QUA", period: "Noite" })];
  const grid = gridByDayPeriod(seats, "pessoas");

  return {
    lens: { ...EMPTY_LENS, cycleId: "cycle-1" },
    cycle: {
      cycleId: "cycle-1",
      startDate: "2026-02-01T00:00:00.000Z",
      endDate: "2026-06-30T00:00:00.000Z",
      cycleStartDate: "2026-02-01T00:00:00.000Z",
      status: "active",
      resetScheduledFor: null,
      licenses: 2,
    },
    filterLabels: [],
    grid,
    totals: gridTotals(seats, grid, "pessoas"),
    frequency: [
      { days: 1, students: 2 },
      { days: 2, students: 0 },
      { days: 3, students: 0 },
      { days: 4, students: 0 },
      { days: 5, students: 0 },
    ],
    fleet: [
      {
        busId: "bus-1",
        busIdentifier: "Ônibus 01",
        shift: "Manhã",
        capacity: 40,
        days: [
          { day: "SEG", value: 1, byUniversity: [], counterFilled: null },
          { day: "TER", value: 0, byUniversity: [], counterFilled: null },
          { day: "QUA", value: 1, byUniversity: [], counterFilled: null },
          { day: "QUI", value: 0, byUniversity: [], counterFilled: null },
          { day: "SEX", value: 0, byUniversity: [], counterFilled: null },
        ],
        peak: 1,
        students: 2,
      },
    ],
    institutions: {
      rows: [
        {
          universityId: "uni-1",
          name: 'Universidade "Alpha", Norte',
          acronym: "UA",
          temporary: false,
          students: 2,
          byShift: [
            { period: "Manhã", students: 2 },
            { period: "Tarde", students: 0 },
            { period: "Noite", students: 0 },
          ],
          courses: [
            {
              courseKey: "engenharia",
              label: "Engenharia de Produção",
              model: "Bacharel",
              students: 2,
              weekly: [1, 0, 1, 0, 0],
            },
          ],
          weekly: [1, 0, 1, 0, 0],
        },
      ],
      alunosComDuplaMatricula: 1,
    },
    funnel: {
      requests: 3,
      approved: 2,
      licenses: 2,
      waitlisted: 1,
      pending: 0,
      revisionPendingStudent: 0,
      revisionResubmitted: 0,
    },
    census: {
      studentsActive: 2,
      studentsInactive: 7,
      studentsPending: 0,
      studentsActiveStatus: 2,
      studentsExpired: 0,
      employeesActive: 4,
      employeesInactive: 2,
    },
    cycles: [],
    generatedAt: "2026-03-01T14:32:00.000Z",
    ...over,
  };
}

/** Parser mínimo de uma linha CSV com aspas — para o round-trip. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      out.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  out.push(field);
  return out;
}

describe("buildInfoCsv", () => {
  it("traz o cabeçalho do recorte", () => {
    const csv = buildInfoCsv(makeView({ filterLabels: ["UNIFLU", "Quarta"] }));

    expect(csv).toContain("Cabeçalho do recorte");
    expect(csv).toContain("UNIFLU · Quarta");
    expect(csv).toContain("Derivado das solicitações de carteirinha");
  });

  it("diz 'nenhum' quando não há filtros", () => {
    expect(buildInfoCsv(makeView())).toContain("nenhum");
  });

  it("sobrevive ao round-trip com acento, vírgula e aspas", () => {
    const csv = buildInfoCsv(makeView());
    const line = csv
      .split("\n")
      .find((l) => l.includes("Universidade"));

    expect(line).toBeDefined();
    const fields = parseCsvLine(line!);

    // Nome com aspas E vírgula volta idêntico.
    expect(fields).toContain('Universidade "Alpha", Norte');
  });

  it("traz todas as seções", () => {
    const csv = buildInfoCsv(makeView());

    for (const section of [
      "Censo",
      "Grade dia x turno",
      "Frequência semanal",
      "Frota por dia",
      "Faculdades",
      "Cursos",
      "Histórico de ciclos",
    ]) {
      expect(csv).toContain(section);
    }
  });

  it("bate com a tela na grade e nos totais", () => {
    const view = makeView();
    const csv = buildInfoCsv(view);
    const manha = csv
      .split("\n")
      .find((l) => l.startsWith('"Manhã"'));

    const fields = parseCsvLine(manha!);
    // Manhã: SEG=1, TER=0, QUA=0, QUI=0, SEX=0, total=1
    expect(fields.slice(1)).toEqual(["1", "0", "0", "0", "0", "1"]);
  });

  it("expõe a dupla matrícula", () => {
    expect(buildInfoCsv(makeView())).toContain("Alunos com dupla matrícula");
  });

  it("marca capacidade nula como sem limite", () => {
    const view = makeView();
    view.fleet[0].capacity = null;

    expect(buildInfoCsv(view)).toContain("sem limite");
  });
});

describe("buildInfoJson", () => {
  it("é JSON válido com lente, origem e séries", () => {
    const parsed = JSON.parse(buildInfoJson(makeView({ filterLabels: ["UA"] })));

    expect(parsed.generatedAt).toBe("2026-03-01T14:32:00.000Z");
    expect(parsed.origin).toContain("allocationSummary");
    expect(parsed.lens.filterLabels).toEqual(["UA"]);
  });

  it("bate com a tela nos números da grade", () => {
    const view = makeView();
    const parsed = JSON.parse(buildInfoJson(view));

    expect(parsed.grid.SEG["Manhã"]).toBe(view.grid.SEG["Manhã"].value);
    expect(parsed.grid.QUA["Noite"]).toBe(view.grid.QUA["Noite"].value);
    expect(parsed.totals.total).toBe(view.totals.total);
  });

  it("preserva a frota e as instituições", () => {
    const parsed = JSON.parse(buildInfoJson(makeView()));

    expect(parsed.fleet[0].busIdentifier).toBe("Ônibus 01");
    expect(parsed.institutions.alunosComDuplaMatricula).toBe(1);
    expect(parsed.institutions.rows[0].courses[0].label).toBe(
      "Engenharia de Produção",
    );
  });
});

describe("consistência entre formatos", () => {
  it("CSV e JSON reportam os mesmos totais", () => {
    const view = makeView();
    const json = JSON.parse(buildInfoJson(view));
    const csv = buildInfoCsv(view);

    const totalLine = csv.split("\n").find((l) => l.startsWith('"Total"'));
    const fields = parseCsvLine(totalLine!);

    expect(Number(fields.at(-1))).toBe(json.totals.total);
  });
});
