import type { LicenseRequestRecord } from "@/types/cards.types";
import type { Student } from "@/types/student";
import type { Bus } from "@/types/university.types";
import {
  UNKNOWN_BUS_KEY,
  UNKNOWN_COURSE_KEY,
  type Seat,
  type SeatStatus,
} from "@/types/info.types";
import {
  isDay,
  isPeriod,
  normalizeCourseName,
  resolveId,
  toPeriod,
} from "./normalize";

/**
 * Status de pedido que representam ocupação real ou reservada. `rejected` e
 * `cancelled` ficam de fora: não ocupam assento nem entram na fila.
 */
const COUNTED_REQUEST_STATUSES = new Set([
  "approved",
  "pending",
  "waitlisted",
  "partially_waitlisted",
]);

/** Ordem de preferência no dedupe: pedido aprovado ganha de pendente. */
const STATUS_RANK: Record<string, number> = {
  approved: 3,
  pending: 2,
  partially_waitlisted: 1,
  waitlisted: 0,
};

export interface BuildSeatsInput {
  requests: LicenseRequestRecord[];
  students: Student[];
  buses: Bus[];
}

/**
 * Converte pedidos de carteirinha em `Seat[]` — a lista de ocupações atômicas
 * (aluno × dia × turno × ônibus) que alimenta a página inteira.
 *
 * A fonte é `allocationSummary`, espelho da collection `bus_allocations` (que
 * não tem endpoint HTTP próprio). Diferente dos contadores `filledSlots` do
 * ônibus — zerados no reset do ciclo —, o `allocationSummary` sobrevive ao
 * encerramento, então é o que permite ler ciclos anteriores.
 */
export function buildSeats({
  requests,
  students,
  buses,
}: BuildSeatsInput): Seat[] {
  const studentById = new Map(students.map((s) => [s._id, s]));

  const busIdByIdentifier = new Map<string, string>();
  const identifierByBusId = new Map<string, string>();
  for (const bus of buses) {
    if (bus.identifier) busIdByIdentifier.set(bus.identifier, bus._id);
    identifierByBusId.set(bus._id, bus.identifier);
  }
  const knownBusIds = new Set(buses.map((b) => b._id));

  /**
   * Dedupe por (aluno, dia, turno, ônibus): dois pedidos do mesmo aluno — por
   * exemplo um `update` sobre um `approved` — descrevem o MESMO assento, não
   * dois. Mantemos um só, preferindo o de status mais forte e, no empate, o
   * mais recente. Somar os dois inflaria a lotação do ônibus.
   */
  const bySeatKey = new Map<string, { seat: Seat; rank: number; createdAt: number }>();

  for (const request of requests) {
    if (!COUNTED_REQUEST_STATUSES.has(request.status)) continue;

    const studentId = resolveId(request.studentId) ?? request.studentId;
    if (!studentId) continue;

    const student = studentById.get(studentId);
    const requestUniversityId = resolveId(request.universityId);
    const studentUniversityId = resolveId(student?.universityId);
    const universityId = requestUniversityId ?? studentUniversityId;

    const courseKey = student?.degree
      ? normalizeCourseName(student.degree)
      : UNKNOWN_COURSE_KEY;
    const shift = toPeriod(student?.shift);

    const rank = STATUS_RANK[request.status] ?? 0;
    const createdAt = Date.parse(request.createdAt ?? "") || 0;

    for (const alloc of request.allocationSummary ?? []) {
      if (alloc.status === "cancelled") continue;
      if (!isDay(alloc.day) || !isPeriod(alloc.period)) continue;

      // Resolve o ônibus por id e, em falta, pelo identificador. Quando nenhum
      // resolve, o assento NÃO é descartado: vai para o balde "não
      // identificado", que é sinal de dado sujo e precisa ficar visível.
      const rawBusId = alloc.busId ? resolveId(alloc.busId) : null;
      const identifier = alloc.busIdentifier ?? "";
      const resolvedBusId =
        rawBusId && knownBusIds.has(rawBusId)
          ? rawBusId
          : (busIdByIdentifier.get(identifier) ?? rawBusId ?? null);

      // Uma perna é ida OU volta; um aluno pode precisar só de uma delas.
      // Mínimo 1: uma alocação existente sempre ocupa ao menos uma perna.
      const legs = ((alloc.needsOutbound ? 1 : 0) +
        (alloc.needsReturn ? 1 : 0) || 1) as 1 | 2;

      const status: SeatStatus =
        alloc.status === "waitlisted" ? "waitlisted" : "active";

      // Identificador exibível: o da alocação, o do ônibus resolvido, ou o
      // rótulo do balde de não identificado.
      const busIdentifier =
        identifier ||
        (resolvedBusId ? identifierByBusId.get(resolvedBusId) : null) ||
        UNKNOWN_BUS_KEY;

      const seat: Seat = {
        studentId,
        requestId: request._id,
        cycleId: request.enrollmentCycleId ?? null,
        universityId,
        courseKey,
        busId: resolvedBusId,
        busIdentifier,
        day: alloc.day,
        period: alloc.period,
        legs,
        status,
        shift,
      };

      const key = `${studentId}|${seat.day}|${seat.period}|${seat.busId ?? UNKNOWN_BUS_KEY}`;
      const existing = bySeatKey.get(key);
      if (
        !existing ||
        rank > existing.rank ||
        (rank === existing.rank && createdAt > existing.createdAt)
      ) {
        bySeatKey.set(key, { seat, rank, createdAt });
      }
    }
  }

  return Array.from(bySeatKey.values(), (entry) => entry.seat);
}
