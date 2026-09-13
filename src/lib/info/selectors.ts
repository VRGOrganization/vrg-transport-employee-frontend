import type { Student } from "@/types/student";
import type { Bus, Course, University } from "@/types/university.types";
import type { LicenseRequestRecord } from "@/types/cards.types";
import {
  DAYS,
  PERIODS,
  UNKNOWN_COURSE_KEY,
  type BusLoad,
  type CourseBreakdown,
  type CycleFunnel,
  type Day,
  type FrequencyBucket,
  type Grid,
  type GridCell,
  type GridTotals,
  type InfoMetric,
  type Period,
  type Seat,
  type UniversityBreakdown,
  type UniversityView,
} from "@/types/info.types";
import {
  compareIdentifiers,
  normalizeCourseName,
  resolveId,
  titleCase,
  toPeriod,
} from "./normalize";

// ── Grade dia × turno ───────────────────────────────────────────────────────

function emptyCell(): GridCell {
  return { value: 0, studentIds: [], byBus: [] };
}

/**
 * Grade 5 dias × 3 turnos.
 *
 * `pessoas` conta alunos DISTINTOS na célula; `pernas` soma ida e volta. As
 * duas nunca se somam: uma fala de gente, a outra de viagens.
 */
export function gridByDayPeriod(seats: Seat[], metric: InfoMetric): Grid {
  const grid = {} as Grid;
  // Acumuladores paralelos: alunos distintos por célula e por (célula, ônibus).
  const cellStudents = new Map<string, Set<string>>();
  const cellLegs = new Map<string, number>();
  const busStudents = new Map<string, Map<string, Set<string>>>();
  const busLegs = new Map<string, Map<string, number>>();
  const busIdentifiers = new Map<string, string>();

  for (const day of DAYS) {
    grid[day] = {} as Record<Period, GridCell>;
    for (const period of PERIODS) grid[day][period] = emptyCell();
  }

  for (const seat of seats) {
    const cellKey = `${seat.day}|${seat.period}`;
    const busKey = seat.busId ?? "__none__";

    let students = cellStudents.get(cellKey);
    if (!students) cellStudents.set(cellKey, (students = new Set()));
    students.add(seat.studentId);
    cellLegs.set(cellKey, (cellLegs.get(cellKey) ?? 0) + seat.legs);

    let perBusStudents = busStudents.get(cellKey);
    if (!perBusStudents) busStudents.set(cellKey, (perBusStudents = new Map()));
    let busSet = perBusStudents.get(busKey);
    if (!busSet) perBusStudents.set(busKey, (busSet = new Set()));
    busSet.add(seat.studentId);

    let perBusLegs = busLegs.get(cellKey);
    if (!perBusLegs) busLegs.set(cellKey, (perBusLegs = new Map()));
    perBusLegs.set(busKey, (perBusLegs.get(busKey) ?? 0) + seat.legs);

    busIdentifiers.set(busKey, seat.busIdentifier);
  }

  for (const day of DAYS) {
    for (const period of PERIODS) {
      const cellKey = `${day}|${period}`;
      const students = cellStudents.get(cellKey);
      if (!students) continue;

      const perBusStudents = busStudents.get(cellKey) ?? new Map();
      const perBusLegs = busLegs.get(cellKey) ?? new Map();

      const byBus = Array.from(perBusStudents.entries(), ([busKey, set]) => ({
        busId: busKey === "__none__" ? "" : busKey,
        busIdentifier: busIdentifiers.get(busKey) ?? "",
        value:
          metric === "pessoas"
            ? (set as Set<string>).size
            : (perBusLegs.get(busKey) ?? 0),
      })).sort((a, b) => compareIdentifiers(a.busIdentifier, b.busIdentifier));

      grid[day][period] = {
        value:
          metric === "pessoas" ? students.size : (cellLegs.get(cellKey) ?? 0),
        studentIds: Array.from(students),
        byBus,
      };
    }
  }

  return grid;
}

/**
 * Totais de linha, coluna e máximo da grade.
 *
 * Totais por dia/turno recontam alunos distintos a partir dos assentos — somar
 * as células duplicaria quem viaja em mais de um turno no mesmo dia.
 */
export function gridTotals(
  seats: Seat[],
  grid: Grid,
  metric: InfoMetric,
): GridTotals {
  const byDay = {} as Record<Day, number>;
  const byPeriod = {} as Record<Period, number>;

  if (metric === "pessoas") {
    const dayStudents = new Map<Day, Set<string>>();
    const periodStudents = new Map<Period, Set<string>>();
    for (const seat of seats) {
      let ds = dayStudents.get(seat.day);
      if (!ds) dayStudents.set(seat.day, (ds = new Set()));
      ds.add(seat.studentId);
      let ps = periodStudents.get(seat.period);
      if (!ps) periodStudents.set(seat.period, (ps = new Set()));
      ps.add(seat.studentId);
    }
    for (const day of DAYS) byDay[day] = dayStudents.get(day)?.size ?? 0;
    for (const period of PERIODS)
      byPeriod[period] = periodStudents.get(period)?.size ?? 0;
  } else {
    for (const day of DAYS) byDay[day] = 0;
    for (const period of PERIODS) byPeriod[period] = 0;
    for (const seat of seats) {
      byDay[seat.day] += seat.legs;
      byPeriod[seat.period] += seat.legs;
    }
  }

  let max = 0;
  for (const day of DAYS) {
    for (const period of PERIODS) {
      max = Math.max(max, grid[day][period].value);
    }
  }

  const total =
    metric === "pessoas"
      ? new Set(seats.map((s) => s.studentId)).size
      : seats.reduce((sum, s) => sum + s.legs, 0);

  return { byDay, byPeriod, max, total };
}

/** Célula de pico e de vale da grade (ignora células zeradas no vale). */
export function gridExtremes(grid: Grid): {
  peak: { day: Day; period: Period; value: number } | null;
  valley: { day: Day; period: Period; value: number } | null;
} {
  let peak: { day: Day; period: Period; value: number } | null = null;
  let valley: { day: Day; period: Period; value: number } | null = null;

  for (const day of DAYS) {
    for (const period of PERIODS) {
      const value = grid[day][period].value;
      if (value <= 0) continue;
      if (!peak || value > peak.value) peak = { day, period, value };
      if (!valley || value < valley.value) valley = { day, period, value };
    }
  }
  return { peak, valley };
}

// ── Dinâmica semanal ────────────────────────────────────────────────────────

/**
 * Histograma "quantos alunos viajam em N dias distintos da semana".
 *
 * É a tradução visual de "as vagas são dinâmicas": mostra que a população não
 * é um bloco fixo de 5 dias, mas uma mistura de frequências.
 */
export function frequencyProfile(seats: Seat[]): FrequencyBucket[] {
  const daysByStudent = new Map<string, Set<Day>>();
  for (const seat of seats) {
    let days = daysByStudent.get(seat.studentId);
    if (!days) daysByStudent.set(seat.studentId, (days = new Set()));
    days.add(seat.day);
  }

  const buckets = new Map<number, number>();
  for (const days of daysByStudent.values()) {
    buckets.set(days.size, (buckets.get(days.size) ?? 0) + 1);
  }

  return Array.from({ length: DAYS.length }, (_, i) => ({
    days: i + 1,
    students: buckets.get(i + 1) ?? 0,
  }));
}

/**
 * Matriz 5×5 simétrica de sobreposição entre dias: quantos alunos aparecem em
 * AMBOS os dias do par. A diagonal é o total do dia.
 *
 * Responde "se eu cortar quinta, quantos desses alunos eu já atendo em outro
 * dia?".
 */
export function dayOverlap(seats: Seat[]): Record<Day, Record<Day, number>> {
  const daysByStudent = new Map<string, Set<Day>>();
  for (const seat of seats) {
    let days = daysByStudent.get(seat.studentId);
    if (!days) daysByStudent.set(seat.studentId, (days = new Set()));
    days.add(seat.day);
  }

  const matrix = {} as Record<Day, Record<Day, number>>;
  for (const a of DAYS) {
    matrix[a] = {} as Record<Day, number>;
    for (const b of DAYS) matrix[a][b] = 0;
  }

  for (const days of daysByStudent.values()) {
    for (const a of days) {
      for (const b of days) matrix[a][b] += 1;
    }
  }

  return matrix;
}

// ── Frota ───────────────────────────────────────────────────────────────────

/**
 * Carga por ônibus e por dia.
 *
 * `counterFilled` é o contador vivo do ônibus (`daySlots.filledSlots`), somado
 * entre faculdades. Só é confiável no ciclo ATIVO — no reset ele zera —, por
 * isso entra como conferência (`showCounters`) e nunca como base de contagem.
 */
export function byBus(
  seats: Seat[],
  buses: Bus[],
  metric: InfoMetric,
  showCounters: boolean,
): BusLoad[] {
  const busById = new Map(buses.map((b) => [b._id, b]));

  const perBus = new Map<
    string,
    {
      identifier: string;
      students: Set<string>;
      days: Map<Day, { students: Set<string>; legs: number; byUniversity: Map<string, Set<string>> }>;
    }
  >();

  for (const seat of seats) {
    const key = seat.busId ?? "";
    let entry = perBus.get(key);
    if (!entry) {
      perBus.set(
        key,
        (entry = {
          identifier: seat.busIdentifier,
          students: new Set(),
          days: new Map(),
        }),
      );
    }
    entry.students.add(seat.studentId);

    let dayEntry = entry.days.get(seat.day);
    if (!dayEntry) {
      entry.days.set(
        seat.day,
        (dayEntry = { students: new Set(), legs: 0, byUniversity: new Map() }),
      );
    }
    dayEntry.students.add(seat.studentId);
    dayEntry.legs += seat.legs;

    const uniKey = seat.universityId ?? "";
    let uniSet = dayEntry.byUniversity.get(uniKey);
    if (!uniSet) dayEntry.byUniversity.set(uniKey, (uniSet = new Set()));
    uniSet.add(seat.studentId);
  }

  const loads: BusLoad[] = [];
  for (const [busId, entry] of perBus) {
    const bus = busId ? busById.get(busId) : undefined;

    const days = DAYS.map((day) => {
      const dayEntry = entry.days.get(day);
      const value = dayEntry
        ? metric === "pessoas"
          ? dayEntry.students.size
          : dayEntry.legs
        : 0;

      let counterFilled: number | null = null;
      if (showCounters && bus?.universitySlots) {
        counterFilled = bus.universitySlots.reduce((sum, slot) => {
          const match = slot.daySlots?.find((d) => d.day === day);
          return sum + (match?.filledSlots ?? 0);
        }, 0);
      }

      return {
        day,
        value,
        byUniversity: dayEntry
          ? Array.from(dayEntry.byUniversity.entries(), ([universityId, set]) => ({
              universityId,
              value: set.size,
            })).sort((a, b) => b.value - a.value)
          : [],
        counterFilled,
      };
    });

    loads.push({
      busId,
      busIdentifier: entry.identifier,
      shift: toPeriod(bus?.shift),
      capacity: bus?.capacity ?? null,
      days,
      peak: days.reduce((m, d) => Math.max(m, d.value), 0),
      students: entry.students.size,
    });
  }

  return loads.sort(
    (a, b) => b.peak - a.peak || compareIdentifiers(a.busIdentifier, b.busIdentifier),
  );
}

// ── Instituições e cursos ───────────────────────────────────────────────────

/**
 * Alunos por faculdade, com quebra por turno e por curso.
 *
 * Segunda matrícula: o aluno conta nas DUAS faculdades (é o que reflete a
 * ocupação real). Por isso a soma das faculdades não bate com o total — daí
 * `alunosComDuplaMatricula` ser devolvido junto, para a UI explicar a
 * diferença em vez de o admin achar que a página erra.
 */
export function byUniversity(
  seats: Seat[],
  students: Student[],
  universities: University[],
  courses: Course[],
): UniversityView {
  const universityById = new Map(universities.map((u) => [u._id, u]));
  const studentById = new Map(students.map((s) => [s._id, s]));

  // Nome bonito do curso: casa `degree` (texto livre) com a collection courses
  // pelo nome normalizado, dentro da faculdade.
  const courseByKey = new Map<string, Course>();
  for (const course of courses) {
    const uniId = resolveId(course.universityId) ?? "";
    courseByKey.set(`${uniId}|${normalizeCourseName(course.name)}`, course);
  }

  const perUniversity = new Map<
    string,
    {
      students: Set<string>;
      byShift: Map<Period, Set<string>>;
      courses: Map<string, { students: Set<string>; weekly: Map<Day, Set<string>> }>;
      weekly: Map<Day, Set<string>>;
    }
  >();

  for (const seat of seats) {
    const uniKey = seat.universityId ?? "";
    let entry = perUniversity.get(uniKey);
    if (!entry) {
      perUniversity.set(
        uniKey,
        (entry = {
          students: new Set(),
          byShift: new Map(),
          courses: new Map(),
          weekly: new Map(),
        }),
      );
    }
    entry.students.add(seat.studentId);

    if (seat.shift) {
      let shiftSet = entry.byShift.get(seat.shift);
      if (!shiftSet) entry.byShift.set(seat.shift, (shiftSet = new Set()));
      shiftSet.add(seat.studentId);
    }

    let weekSet = entry.weekly.get(seat.day);
    if (!weekSet) entry.weekly.set(seat.day, (weekSet = new Set()));
    weekSet.add(seat.studentId);

    let courseEntry = entry.courses.get(seat.courseKey);
    if (!courseEntry) {
      entry.courses.set(
        seat.courseKey,
        (courseEntry = { students: new Set(), weekly: new Map() }),
      );
    }
    courseEntry.students.add(seat.studentId);
    let courseWeek = courseEntry.weekly.get(seat.day);
    if (!courseWeek) courseEntry.weekly.set(seat.day, (courseWeek = new Set()));
    courseWeek.add(seat.studentId);
  }

  const rows: UniversityBreakdown[] = [];
  for (const [universityId, entry] of perUniversity) {
    const university = universityById.get(universityId);

    const courseRows: CourseBreakdown[] = Array.from(
      entry.courses.entries(),
      ([courseKey, courseEntry]) => {
        const matched = courseByKey.get(`${universityId}|${courseKey}`);
        // Sem correspondência na collection: exibe o `degree` original do
        // aluno; sem nem isso, cai no balde de não identificado.
        const rawDegree = Array.from(courseEntry.students)
          .map((id) => studentById.get(id)?.degree)
          .find((d) => Boolean(d));

        const label =
          courseKey === UNKNOWN_COURSE_KEY
            ? "Curso não identificado"
            : (matched?.name ?? (rawDegree ? titleCase(rawDegree) : courseKey));

        return {
          courseKey,
          label,
          model: matched?.model ?? null,
          students: courseEntry.students.size,
          weekly: DAYS.map((day) => courseEntry.weekly.get(day)?.size ?? 0),
        };
      },
    ).sort((a, b) => {
      // O balde de não identificado vai sempre por último: é sinal de dado
      // sujo, fica visível mas não disputa o topo da lista.
      if (a.courseKey === UNKNOWN_COURSE_KEY) return 1;
      if (b.courseKey === UNKNOWN_COURSE_KEY) return -1;
      return b.students - a.students || a.label.localeCompare(b.label, "pt-BR");
    });

    rows.push({
      universityId,
      name: university?.name ?? "Faculdade não identificada",
      acronym: university?.acronym ?? "-",
      temporary: Boolean(university?.temporary),
      students: entry.students.size,
      byShift: PERIODS.map((period) => ({
        period,
        students: entry.byShift.get(period)?.size ?? 0,
      })),
      courses: courseRows,
      weekly: DAYS.map((day) => entry.weekly.get(day)?.size ?? 0),
    });
  }

  rows.sort(
    (a, b) => b.students - a.students || a.name.localeCompare(b.name, "pt-BR"),
  );

  // Dupla matrícula: conta o aluno presente em mais de uma faculdade dentro
  // do recorte atual.
  const universitiesByStudent = new Map<string, Set<string>>();
  for (const seat of seats) {
    let set = universitiesByStudent.get(seat.studentId);
    if (!set) universitiesByStudent.set(seat.studentId, (set = new Set()));
    if (seat.universityId) set.add(seat.universityId);
  }
  let alunosComDuplaMatricula = 0;
  for (const set of universitiesByStudent.values()) {
    if (set.size > 1) alunosComDuplaMatricula += 1;
  }

  return { rows, alunosComDuplaMatricula };
}

// ── Ciclo ───────────────────────────────────────────────────────────────────

/**
 * Funil do ciclo a partir dos pedidos daquele ciclo.
 *
 * "Carteirinha emitida" conta alunos DISTINTOS com pedido `approved` e
 * `licenseId` presente — não linhas de pedido. Um aluno com pedido inicial
 * aprovado e depois uma atualização aprovada continua sendo uma carteirinha.
 */
export function cycleFunnel(requests: LicenseRequestRecord[]): CycleFunnel {
  const licensed = new Set<string>();
  let approved = 0;
  let waitlisted = 0;
  let pending = 0;
  let revisionPendingStudent = 0;
  let revisionResubmitted = 0;

  for (const request of requests) {
    const studentId = resolveId(request.studentId) ?? request.studentId;

    switch (request.status) {
      case "approved":
        approved += 1;
        if (request.licenseId) licensed.add(studentId);
        break;
      case "waitlisted":
      case "partially_waitlisted":
        waitlisted += 1;
        break;
      case "pending":
        pending += 1;
        break;
      case "revision":
        if (request.revisionStage === "resubmitted") revisionResubmitted += 1;
        else revisionPendingStudent += 1;
        break;
    }
  }

  return {
    requests: requests.length,
    approved,
    licenses: licensed.size,
    waitlisted,
    pending,
    revisionPendingStudent,
    revisionResubmitted,
  };
}

/** Carteirinhas emitidas por ciclo — alunos distintos, agrupados por ciclo. */
export function licensesByCycle(
  requests: LicenseRequestRecord[],
): Map<string, number> {
  const perCycle = new Map<string, Set<string>>();
  for (const request of requests) {
    if (request.status !== "approved" || !request.licenseId) continue;
    const cycleId = request.enrollmentCycleId ?? "";
    if (!cycleId) continue;
    const studentId = resolveId(request.studentId) ?? request.studentId;
    let set = perCycle.get(cycleId);
    if (!set) perCycle.set(cycleId, (set = new Set()));
    set.add(studentId);
  }
  return new Map(Array.from(perCycle, ([cycleId, set]) => [cycleId, set.size]));
}
