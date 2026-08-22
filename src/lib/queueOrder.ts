import type { LicenseRequestRecord } from "@/types/cards.types";

/** Prioridade default do backend quando o pedido não traz `priorityLevel`. */
export const DEFAULT_PRIORITY_LEVEL = 3;

/** Pedidos que ainda ocupam lugar na fila (mesmos status enfileirados do backend). */
const QUEUED_STATUSES = new Set(["pending", "waitlisted", "partially_waitlisted"]);

export type QueueRequest = Pick<
  LicenseRequestRecord,
  "studentId" | "status" | "createdAt"
> &
  Partial<Pick<LicenseRequestRecord, "priorityLevel" | "filaPosition">>;

function toTime(value: string | null | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  // Data inválida nunca deve "furar" a fila: vai para o fim, não para o topo.
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function priorityOf(request: QueueRequest | undefined): number {
  return typeof request?.priorityLevel === "number"
    ? request.priorityLevel
    : DEFAULT_PRIORITY_LEVEL;
}

/**
 * Compara dois pedidos na ordem de atendimento da fila:
 * prioridade (menor = mais prioritário) e, empatando, FIFO por `createdAt` asc
 * (o primeiro a entrar é o primeiro a sair). `_id` desempata para manter a
 * ordenação estável quando dois pedidos têm o mesmo instante.
 */
export function compareQueueRequests(a: QueueRequest, b: QueueRequest): number {
  const pa = priorityOf(a);
  const pb = priorityOf(b);
  if (pa !== pb) return pa - pb;

  const ta = toTime(a.createdAt);
  const tb = toTime(b.createdAt);
  if (ta !== tb) return ta - tb;

  const ia = (a as { _id?: string })._id ?? "";
  const ib = (b as { _id?: string })._id ?? "";
  return ia.localeCompare(ib);
}

/**
 * Compara pedidos da lista de espera: `filaPosition` asc quando o backend a
 * define e, na ausência dela, cai no critério normal da fila (prioridade → FIFO).
 */
export function compareWaitlistRequests(a: QueueRequest, b: QueueRequest): number {
  const pa = typeof a.filaPosition === "number" ? a.filaPosition : Number.MAX_VALUE;
  const pb = typeof b.filaPosition === "number" ? b.filaPosition : Number.MAX_VALUE;
  if (pa !== pb) return pa - pb;
  return compareQueueRequests(a, b);
}

/**
 * Mapa studentId → pedido que representa o aluno na fila.
 *
 * Um aluno pode ter mais de um pedido (ex.: `rejected` antigo + `pending` novo).
 * O pedido enfileirado mais recente é o que vale; sem nenhum enfileirado, cai no
 * mais recente de qualquer status. A lista de entrada chega ordenada por
 * `createdAt` DESC do backend, mas não dependemos disso: comparamos as datas.
 */
export function buildQueueRequestByStudent<T extends QueueRequest>(
  requests: T[],
): Map<string, T> {
  const map = new Map<string, T>();

  for (const request of requests) {
    if (!request.studentId) continue;
    const current = map.get(request.studentId);
    if (!current) {
      map.set(request.studentId, request);
      continue;
    }

    const currentQueued = QUEUED_STATUSES.has(current.status);
    const candidateQueued = QUEUED_STATUSES.has(request.status);

    // Pedido enfileirado sempre ganha de um não enfileirado (rejeitado/cancelado).
    if (candidateQueued !== currentQueued) {
      if (candidateQueued) map.set(request.studentId, request);
      continue;
    }

    // Mesmo "tipo": vale o mais recente.
    if (toTime(request.createdAt) > toTime(current.createdAt)) {
      map.set(request.studentId, request);
    }
  }

  return map;
}

/**
 * Ordena alunos pela posição na fila usando o pedido de cada um.
 * Alunos sem pedido correspondente vão para o fim, em ordem alfabética, para a
 * lista nunca depender da ordem não determinística vinda de `GET /student`.
 */
export function sortStudentsByQueue<S extends { _id: string; name: string }>(
  students: S[],
  requestByStudent: Map<string, QueueRequest>,
  comparator: (a: QueueRequest, b: QueueRequest) => number = compareQueueRequests,
): S[] {
  return [...students].sort((a, b) => {
    const ra = requestByStudent.get(a._id);
    const rb = requestByStudent.get(b._id);

    if (ra && rb) return comparator(ra, rb);
    if (ra) return -1;
    if (rb) return 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}
