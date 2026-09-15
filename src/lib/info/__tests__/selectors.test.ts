import { describe, expect, it } from "vitest";
import {
  byBus,
  byUniversity,
  cycleFunnel,
  dayOverlap,
  frequencyProfile,
  gridByDayPeriod,
  gridExtremes,
  gridTotals,
  licensesByCycle,
} from "../selectors";
import { UNKNOWN_COURSE_KEY, type Seat } from "@/types/info.types";
import { bus, course, request, student, university } from "./factories";

function seat(over: Partial<Seat> = {}): Seat {
  return {
    studentId: "s1",
    requestId: "r1",
    cycleId: "cycle-1",
    universityId: "uni-1",
    courseKey: "engenharia de producao",
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

describe("gridByDayPeriod", () => {
  it("monta uma grade de 5 dias por 3 turnos", () => {
    const grid = gridByDayPeriod([]);

    expect(Object.keys(grid)).toEqual(["SEG", "TER", "QUA", "QUI", "SEX"]);
    expect(Object.keys(grid.SEG)).toEqual(["Manhã", "Tarde", "Noite"]);
  });

  it("deduplica o aluno dentro da célula ao contar pessoas", () => {
    // Mesmo aluno, mesma célula, ônibus diferentes: é UMA pessoa.
    const seats = [
      seat({ studentId: "s1", busId: "bus-1" }),
      seat({ studentId: "s1", busId: "bus-2", busIdentifier: "Ônibus 02" }),
    ];

    expect(gridByDayPeriod(seats).SEG["Manhã"].value).toBe(1);
  });

  it("quebra a célula por ônibus", () => {
    const seats = [
      seat({ studentId: "s1", busId: "bus-1", busIdentifier: "Ônibus 01" }),
      seat({ studentId: "s2", busId: "bus-2", busIdentifier: "Ônibus 02" }),
      seat({ studentId: "s3", busId: "bus-2", busIdentifier: "Ônibus 02" }),
    ];

    const cell = gridByDayPeriod(seats).SEG["Manhã"];
    expect(cell.byBus).toEqual([
      { busId: "bus-1", busIdentifier: "Ônibus 01", value: 1 },
      { busId: "bus-2", busIdentifier: "Ônibus 02", value: 2 },
    ]);
  });
});

describe("gridTotals", () => {
  it("não duplica o aluno que viaja em dois turnos do mesmo dia", () => {
    const seats = [
      seat({ studentId: "s1", day: "SEG", period: "Manhã" }),
      seat({ studentId: "s1", day: "SEG", period: "Noite" }),
    ];
    const grid = gridByDayPeriod(seats);

    const totals = gridTotals(seats, grid);

    expect(totals.byDay.SEG).toBe(1);
    expect(totals.total).toBe(1);
  });

  it("expõe o máximo da grade", () => {
    const seats = [
      seat({ studentId: "s1" }),
      seat({ studentId: "s2" }),
      seat({ studentId: "s3", day: "SEX", period: "Noite" }),
    ];
    const grid = gridByDayPeriod(seats);

    expect(gridTotals(seats, grid).max).toBe(2);
  });
});

describe("gridExtremes", () => {
  it("acha pico e vale ignorando células zeradas", () => {
    const seats = [
      seat({ studentId: "s1", day: "QUA", period: "Noite" }),
      seat({ studentId: "s2", day: "QUA", period: "Noite" }),
      seat({ studentId: "s3", day: "SEX", period: "Manhã" }),
    ];
    const grid = gridByDayPeriod(seats);

    const { peak, valley } = gridExtremes(grid);

    expect(peak).toEqual({ day: "QUA", period: "Noite", value: 2 });
    expect(valley).toEqual({ day: "SEX", period: "Manhã", value: 1 });
  });

  it("devolve nulos quando não há nenhum assento", () => {
    const { peak, valley } = gridExtremes(gridByDayPeriod([]));

    expect(peak).toBeNull();
    expect(valley).toBeNull();
  });
});

describe("frequencyProfile", () => {
  it("coloca o aluno de 3 dias no balde 3, uma única vez", () => {
    const seats = [
      seat({ studentId: "s1", day: "SEG" }),
      seat({ studentId: "s1", day: "TER" }),
      seat({ studentId: "s1", day: "QUA" }),
      // Segundo assento no mesmo dia não muda o balde.
      seat({ studentId: "s1", day: "QUA", period: "Noite" }),
    ];

    const profile = frequencyProfile(seats);

    expect(profile.find((b) => b.days === 3)?.students).toBe(1);
    expect(profile.reduce((sum, b) => sum + b.students, 0)).toBe(1);
  });

  it("devolve sempre os cinco baldes", () => {
    expect(frequencyProfile([]).map((b) => b.days)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("dayOverlap", () => {
  it("é simétrica e tem o total do dia na diagonal", () => {
    const seats = [
      seat({ studentId: "s1", day: "SEG" }),
      seat({ studentId: "s1", day: "QUI" }),
      seat({ studentId: "s2", day: "SEG" }),
    ];

    const m = dayOverlap(seats);

    expect(m.SEG.SEG).toBe(2);
    expect(m.QUI.QUI).toBe(1);
    expect(m.SEG.QUI).toBe(1);
    expect(m.SEG.QUI).toBe(m.QUI.SEG);
    expect(m.SEG.TER).toBe(0);
  });
});

describe("byBus", () => {
  it("ordena por pico e devolve os cinco dias sempre", () => {
    const seats = [
      seat({ studentId: "s1", busId: "bus-1", busIdentifier: "Ônibus 01" }),
      seat({ studentId: "s2", busId: "bus-2", busIdentifier: "Ônibus 02" }),
      seat({ studentId: "s3", busId: "bus-2", busIdentifier: "Ônibus 02" }),
    ];

    const loads = byBus(seats, [bus(), bus({ _id: "bus-2", identifier: "Ônibus 02" })], false);

    expect(loads[0].busId).toBe("bus-2");
    expect(loads[0].peak).toBe(2);
    expect(loads[0].days).toHaveLength(5);
    expect(loads[0].days.map((d) => d.day)).toEqual(["SEG", "TER", "QUA", "QUI", "SEX"]);
  });

  it("quebra o dia por faculdade", () => {
    const seats = [
      seat({ studentId: "s1", universityId: "uni-1" }),
      seat({ studentId: "s2", universityId: "uni-2" }),
      seat({ studentId: "s3", universityId: "uni-2" }),
    ];

    const loads = byBus(seats, [bus()], false);

    expect(loads[0].days[0].byUniversity).toEqual([
      { universityId: "uni-2", value: 2 },
      { universityId: "uni-1", value: 1 },
    ]);
  });

  it("soma o contador do ônibus por dia só quando pedido", () => {
    const withSlots = bus({
      universitySlots: [
        {
          universityId: "uni-1",
          priorityOrder: 1,
          daySlots: [
            { day: "SEG", filledSlots: 12 },
            { day: "TER", filledSlots: 3 },
          ],
        },
        {
          universityId: "uni-2",
          priorityOrder: 2,
          daySlots: [{ day: "SEG", filledSlots: 5 }],
        },
      ],
    });
    const seats = [seat()];

    const comContador = byBus(seats, [withSlots], true);
    const semContador = byBus(seats, [withSlots], false);

    // Capacidade é POR faculdade × dia; o total do dia soma os vínculos.
    expect(comContador[0].days[0].counterFilled).toBe(17);
    expect(semContador[0].days[0].counterFilled).toBeNull();
  });

  it("expõe capacidade nula como sem limite", () => {
    const loads = byBus([seat()], [bus({ capacity: null })], false);

    expect(loads[0].capacity).toBeNull();
  });
});

describe("byUniversity", () => {
  it("conta o aluno com dupla matrícula nas duas faculdades", () => {
    const seats = [
      seat({ studentId: "s1", universityId: "uni-1" }),
      seat({ studentId: "s1", universityId: "uni-2", day: "TER" }),
    ];

    const view = byUniversity(
      seats,
      [student({ _id: "s1" })],
      [university(), university({ _id: "uni-2", name: "Universidade Beta", acronym: "UB" })],
      [course()],
    );

    expect(view.rows.find((r) => r.universityId === "uni-1")?.students).toBe(1);
    expect(view.rows.find((r) => r.universityId === "uni-2")?.students).toBe(1);
    expect(view.alunosComDuplaMatricula).toBe(1);
  });

  it("não conta dupla matrícula para aluno em uma faculdade só", () => {
    const view = byUniversity(
      [seat({ studentId: "s1" }), seat({ studentId: "s1", day: "TER" })],
      [student({ _id: "s1" })],
      [university()],
      [course()],
    );

    expect(view.alunosComDuplaMatricula).toBe(0);
  });

  it("usa o nome cadastrado do curso e mantém o balde de não identificado por último", () => {
    const seats = [
      seat({ studentId: "s1", courseKey: "engenharia de producao" }),
      seat({ studentId: "s2", courseKey: UNKNOWN_COURSE_KEY }),
      seat({ studentId: "s3", courseKey: UNKNOWN_COURSE_KEY }),
      seat({ studentId: "s4", courseKey: UNKNOWN_COURSE_KEY }),
    ];

    const view = byUniversity(
      seats,
      [student({ _id: "s1" }), student({ _id: "s2", degree: undefined })],
      [university()],
      [course()],
    );

    const courses = view.rows[0].courses;
    expect(courses[0].label).toBe("Engenharia de Produção");
    expect(courses[0].model).toBe("Bacharel");
    // Mesmo sendo o maior, o balde sujo fica por último — visível, não no topo.
    expect(courses.at(-1)?.label).toBe("Curso não identificado");
  });

  it("quebra por turno declarado do aluno", () => {
    const seats = [
      seat({ studentId: "s1", shift: "Manhã" }),
      seat({ studentId: "s2", shift: "Noite" }),
      seat({ studentId: "s3", shift: "Noite" }),
    ];

    const view = byUniversity(seats, [], [university()], []);

    expect(view.rows[0].byShift).toEqual([
      { period: "Manhã", students: 1 },
      { period: "Tarde", students: 0 },
      { period: "Noite", students: 2 },
    ]);
  });

  it("devolve o fluxo semanal de cinco valores", () => {
    const seats = [
      seat({ studentId: "s1", day: "SEG" }),
      seat({ studentId: "s2", day: "SEG" }),
      seat({ studentId: "s1", day: "SEX" }),
    ];

    const view = byUniversity(seats, [], [university()], []);

    expect(view.rows[0].weekly).toEqual([2, 0, 0, 0, 1]);
  });
});

describe("cycleFunnel", () => {
  it("conta carteirinhas por aluno distinto, não por pedido", () => {
    const funnel = cycleFunnel([
      request({ _id: "r1", studentId: "s1", status: "approved", licenseId: "l1" }),
      // Atualização aprovada do MESMO aluno: continua uma carteirinha.
      request({ _id: "r2", studentId: "s1", status: "approved", licenseId: "l1", type: "update" }),
      request({ _id: "r3", studentId: "s2", status: "approved", licenseId: "l2" }),
    ]);

    expect(funnel.licenses).toBe(2);
    expect(funnel.approved).toBe(3);
  });

  it("não conta como carteirinha um aprovado sem licenseId", () => {
    const funnel = cycleFunnel([
      request({ _id: "r1", status: "approved", licenseId: null }),
    ]);

    expect(funnel.licenses).toBe(0);
  });

  it("soma lista de espera incluindo parcialmente em espera", () => {
    const funnel = cycleFunnel([
      request({ _id: "r1", status: "waitlisted" }),
      request({ _id: "r2", status: "partially_waitlisted" }),
    ]);

    expect(funnel.waitlisted).toBe(2);
  });

  it("separa revisão aguardando aluno de revisão reenviada", () => {
    const funnel = cycleFunnel([
      request({ _id: "r1", status: "revision", revisionStage: "pending_student" }),
      request({ _id: "r2", status: "revision", revisionStage: "resubmitted" }),
      request({ _id: "r3", status: "revision" }),
    ]);

    expect(funnel.revisionPendingStudent).toBe(2);
    expect(funnel.revisionResubmitted).toBe(1);
  });
});

describe("licensesByCycle", () => {
  it("agrupa alunos distintos com carteirinha por ciclo", () => {
    const map = licensesByCycle([
      request({ _id: "r1", studentId: "s1", enrollmentCycleId: "c1" }),
      request({ _id: "r2", studentId: "s1", enrollmentCycleId: "c1" }),
      request({ _id: "r3", studentId: "s2", enrollmentCycleId: "c1" }),
      request({ _id: "r4", studentId: "s1", enrollmentCycleId: "c2" }),
      request({ _id: "r5", status: "pending", licenseId: null, enrollmentCycleId: "c2" }),
    ]);

    expect(map.get("c1")).toBe(2);
    expect(map.get("c2")).toBe(1);
  });
});
