/**
 * Vocabulário da sala de controle (/admin/info).
 *
 * A página inteira é uma redução de `Seat[]`: cada painel é uma agregação da
 * mesma lista, filtrada pela mesma lente. Nenhum painel busca dados próprios
 * nem reimplementa regra de negócio.
 */

import type { EnrollmentCycleStatus } from "@/types/enrollmentPeriod";

export const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"] as const;
export type Day = (typeof DAYS)[number];

export const PERIODS = ["Manhã", "Tarde", "Noite"] as const;
export type Period = (typeof PERIODS)[number];

/** Chave do balde de curso não identificado (degree é texto livre no backend). */
export const UNKNOWN_COURSE_KEY = "__nao_identificado__";
/** Chave do balde de ônibus não identificado (alocação sem busId resolvível). */
export const UNKNOWN_BUS_KEY = "__onibus_nao_identificado__";

export type InfoMetric = "pessoas" | "pernas";

/**
 * A "lente": o recorte único que TODOS os painéis obedecem. Vive na URL, de
 * modo que um recorte é um link compartilhável.
 */
export interface InfoLens {
  /** `null` = ciclo ativo. */
  cycleId: string | null;
  universityId: string | null;
  /** Nome do curso normalizado (ver normalizeCourseName). */
  courseKey: string | null;
  busId: string | null;
  /** Turno declarado do aluno. */
  shift: Period | null;
  /** Recorte de dia vindo da grade. */
  day: Day | null;
  /** Recorte de turno vindo da grade. */
  period: Period | null;
  metric: InfoMetric;
}

export const EMPTY_LENS: InfoLens = {
  cycleId: null,
  universityId: null,
  courseKey: null,
  busId: null,
  shift: null,
  day: null,
  period: null,
  metric: "pessoas",
};

export type SeatStatus = "active" | "waitlisted";

/**
 * Uma ocupação atômica: aluno × dia × turno × ônibus. A menor unidade da
 * página — espelho de uma entrada de `bus_allocations`, lida via
 * `allocationSummary` do pedido de carteirinha (a collection não tem endpoint
 * HTTP próprio, e o `allocationSummary` funciona para ciclos encerrados).
 */
export interface Seat {
  studentId: string;
  requestId: string;
  cycleId: string | null;
  universityId: string | null;
  courseKey: string;
  /** `null` quando a alocação não resolveu para um ônibus conhecido. */
  busId: string | null;
  busIdentifier: string;
  day: Day;
  period: Period;
  /** needsOutbound + needsReturn — mínimo 1. */
  legs: 1 | 2;
  status: SeatStatus;
  /** Turno declarado do aluno (≠ period, que é o turno da viagem). */
  shift: Period | null;
}

// ── Saídas dos seletores ────────────────────────────────────────────────────

export interface GridCell {
  /** Valor na métrica pedida (pessoas distintas ou pernas). */
  value: number;
  /** Alunos distintos na célula — base do drill-down. */
  studentIds: string[];
  /** Quebra por ônibus, na mesma métrica, ordenada pela rampa estável. */
  byBus: Array<{ busId: string; busIdentifier: string; value: number }>;
}

export type Grid = Record<Day, Record<Period, GridCell>>;

export interface GridTotals {
  byDay: Record<Day, number>;
  byPeriod: Record<Period, number>;
  max: number;
  total: number;
}

export interface FrequencyBucket {
  /** Quantidade de dias distintos na semana (1..5). */
  days: number;
  students: number;
}

export interface BusDayLoad {
  day: Day;
  value: number;
  /** Quebra por faculdade dentro do dia. */
  byUniversity: Array<{ universityId: string; value: number }>;
  /**
   * Contador vivo do ônibus (`daySlots.filledSlots`) somado entre faculdades.
   * Só é confiável no ciclo ATIVO — no reset do ciclo ele é zerado.
   */
  counterFilled: number | null;
}

export interface BusLoad {
  busId: string;
  busIdentifier: string;
  shift: Period | null;
  /** `null` = sem limite. Teto POR faculdade × dia, não do ônibus inteiro. */
  capacity: number | null;
  days: BusDayLoad[];
  /** Maior valor entre os dias — base da normalização do trilho. */
  peak: number;
  /** Total de pessoas distintas no ônibus na semana. */
  students: number;
}

export interface CourseBreakdown {
  courseKey: string;
  label: string;
  model: string | null;
  students: number;
  /** Fluxo semanal de 5 valores (SEG..SEX) para o sparkline. */
  weekly: number[];
}

export interface UniversityBreakdown {
  universityId: string;
  name: string;
  acronym: string;
  temporary: boolean;
  students: number;
  byShift: Array<{ period: Period; students: number }>;
  courses: CourseBreakdown[];
  weekly: number[];
}

export interface UniversityView {
  rows: UniversityBreakdown[];
  /**
   * Alunos presentes em mais de uma faculdade. Exposto porque a soma das
   * faculdades não bate com o total sem essa explicação.
   */
  alunosComDuplaMatricula: number;
}

export interface Census {
  studentsActive: number;
  studentsInactive: number;
  studentsPending: number;
  studentsActiveStatus: number;
  studentsExpired: number;
  employeesActive: number;
  employeesInactive: number;
}

export interface CycleFunnel {
  requests: number;
  approved: number;
  licenses: number;
  waitlisted: number;
  pending: number;
  revisionPendingStudent: number;
  revisionResubmitted: number;
}

export interface CycleSummary {
  cycleId: string;
  startDate: string | null;
  endDate: string | null;
  cycleStartDate: string;
  status: EnrollmentCycleStatus;
  resetScheduledFor: string | null;
  licenses: number;
}
