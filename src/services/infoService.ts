import { http } from "./http";
import { fetchAllPages, fetchTotal } from "./fetchAllPages";
import type { Paginated } from "@/types/api";
import type { LicenseRequestRecord } from "@/types/cards.types";
import type { Student } from "@/types/student";
import type { Bus, Course, University } from "@/types/university.types";
import type { EnrollmentPeriod } from "@/types/enrollmentPeriod";
import type { Census } from "@/types/info.types";

/** Tetos de `limit` de cada endpoint, conferidos nos controllers do backend. */
const LIMIT = {
  licenseRequest: 1000,
  default: 100,
} as const;

export interface BusRosterDayPresence {
  period: string;
  status: string;
}

/**
 * Entrada nominal do roster de um ônibus.
 *
 * Duas ressalvas do backend (bus-queue-query.service):
 *  (a) só traz alocações `active` e `waitlisted`;
 *  (b) `days` guarda UMA entrada por dia — um aluno que pega o mesmo ônibus de
 *      manhã e à noite na mesma segunda aparece com um único período.
 * Por isso o roster serve ao drill-down nominal, nunca à contagem agregada:
 * agregação vem sempre de `allocationSummary` (ver buildSeats).
 */
export interface BusRosterEntry {
  studentId: string;
  name: string | null;
  email: string | null;
  days: Record<string, BusRosterDayPresence | null>;
}

/** Painéis que podem falhar isoladamente sem derrubar a página. */
export interface InfoSnapshot {
  requests: LicenseRequestRecord[];
  students: Student[];
  buses: Bus[];
  universities: University[];
  courses: Course[];
  cycles: EnrollmentPeriod[];
  activeCycleId: string | null;
  census: Census;
  /** Ônibus desativados — só o total, para o rodapé da frota. */
  busesInactive: number;
  generatedAt: string;
  /** Partes que falharam, para a UI avisar sem mentir sobre o resto. */
  failures: string[];
}

async function settled<T>(
  label: string,
  fallback: T,
  run: () => Promise<T>,
  failures: string[],
): Promise<T> {
  try {
    return await run();
  } catch {
    failures.push(label);
    return fallback;
  }
}

/**
 * Carrega tudo que a sala de controle precisa, em paralelo.
 *
 * NÃO usa `GET /license/all`: cada item daquele endpoint gera uma presigned URL
 * no S3, então paginar até o fim dispararia centenas de chamadas de storage
 * para um número que sai de graça dos próprios pedidos (status `approved` com
 * `licenseId`).
 *
 * Falha parcial não derruba a página: cada bloco cai para um valor vazio e o
 * nome dele entra em `failures`.
 */
export async function loadInfoSnapshot(): Promise<InfoSnapshot> {
  const failures: string[] = [];

  const [
    requests,
    students,
    buses,
    universities,
    courses,
    cycles,
    activeCycle,
    census,
    busesInactive,
  ] = await Promise.all([
    settled(
      "solicitações",
      [] as LicenseRequestRecord[],
      () =>
        fetchAllPages<LicenseRequestRecord>(
          (page, limit) =>
            http.get<Paginated<LicenseRequestRecord>>(
              `/license-request?page=${page}&limit=${limit}`,
            ),
          LIMIT.licenseRequest,
        ),
      failures,
    ),
    settled(
      "alunos",
      [] as Student[],
      // /student/all não é paginado e devolve só os ativos.
      () => http.get<Student[]>("/student/all"),
      failures,
    ),
    settled(
      "ônibus",
      [] as Bus[],
      () =>
        fetchAllPages<Bus>(
          (page, limit) =>
            http.get<Paginated<Bus>>(`/bus/active?page=${page}&limit=${limit}`),
          LIMIT.default,
        ),
      failures,
    ),
    settled(
      "faculdades",
      [] as University[],
      () =>
        fetchAllPages<University>(
          (page, limit) =>
            http.get<Paginated<University>>(`/university?page=${page}&limit=${limit}`),
          LIMIT.default,
        ),
      failures,
    ),
    settled(
      "cursos",
      [] as Course[],
      () =>
        fetchAllPages<Course>(
          (page, limit) =>
            http.get<Paginated<Course>>(`/course?page=${page}&limit=${limit}`),
          LIMIT.default,
        ),
      failures,
    ),
    settled(
      "ciclos",
      [] as EnrollmentPeriod[],
      () =>
        fetchAllPages<EnrollmentPeriod>(
          (page, limit) =>
            http.get<Paginated<EnrollmentPeriod>>(
              `/enrollment-period?page=${page}&limit=${limit}`,
            ),
          LIMIT.default,
        ),
      failures,
    ),
    settled(
      "ciclo ativo",
      null as EnrollmentPeriod | null,
      () => http.get<EnrollmentPeriod | null>("/enrollment-period/active"),
      failures,
    ),
    loadCensus(failures),
    settled(
      "ônibus inativos",
      0,
      () =>
        fetchTotal<Bus>((page, limit) =>
          http.get<Paginated<Bus>>(`/bus/inactive?page=${page}&limit=${limit}`),
        ),
      failures,
    ),
  ]);

  return {
    requests,
    students,
    buses,
    universities,
    courses,
    cycles,
    activeCycleId: activeCycle?._id ?? null,
    census,
    busesInactive,
    generatedAt: new Date().toISOString(),
    failures,
  };
}

/**
 * Censo de pessoas. Os inativos vêm só como `total` (limit=1): a página mostra
 * o número, não a lista.
 */
async function loadCensus(failures: string[]): Promise<Census> {
  const [studentsInactive, employeesActive, employeesInactive] = await Promise.all([
    settled(
      "alunos inativos",
      0,
      () =>
        fetchTotal<Student>((page, limit) =>
          http.get<Paginated<Student>>(`/student/inactive?page=${page}&limit=${limit}`),
        ),
      failures,
    ),
    settled(
      "funcionários",
      0,
      () =>
        fetchTotal<unknown>((page, limit) =>
          http.get<Paginated<unknown>>(`/employee?page=${page}&limit=${limit}`),
        ),
      failures,
    ),
    settled(
      "funcionários inativos",
      0,
      () =>
        fetchTotal<unknown>((page, limit) =>
          http.get<Paginated<unknown>>(`/employee/inactive?page=${page}&limit=${limit}`),
        ),
      failures,
    ),
  ]);

  return {
    // Preenchidos pelo chamador a partir da lista de alunos já carregada:
    // `active` (cadastro) e `status` (verificação) são coisas diferentes.
    studentsActive: 0,
    studentsPending: 0,
    studentsActiveStatus: 0,
    studentsExpired: 0,
    studentsInactive,
    employeesActive,
    employeesInactive,
  };
}

/** Completa o censo com as quebras de status, a partir dos alunos carregados. */
export function withStudentStatusCounts(census: Census, students: Student[]): Census {
  let pending = 0;
  let active = 0;
  let expired = 0;
  for (const student of students) {
    if (student.status === "PENDING") pending += 1;
    else if (student.status === "EXPIRED") expired += 1;
    else if (student.status === "ACTIVE") active += 1;
  }
  return {
    ...census,
    studentsActive: students.length,
    studentsPending: pending,
    studentsActiveStatus: active,
    studentsExpired: expired,
  };
}

/** Roster nominal de um ônibus, sob demanda (drill-down). */
export function loadBusRoster(
  busId: string,
  cycleId: string | null,
): Promise<BusRosterEntry[]> {
  const query = cycleId ? `?enrollmentCycleId=${encodeURIComponent(cycleId)}` : "";
  return http.get<BusRosterEntry[]>(
    `/bus/${encodeURIComponent(busId)}/queue${query}`,
  );
}
