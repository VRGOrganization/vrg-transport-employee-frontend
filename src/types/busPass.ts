/** Espelha os DTOs de `bus-pass` do backend. Escrito à mão, como o resto. */

export type BusPassStatus =
  | "pending"
  | "revision"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type BusPassMode = "single" | "integral";

/** Data civil de Brasília, `YYYY-MM-DD`. */
export type CivilDate = string;

export interface BusPassLeg {
  busId: string;
  busIdentifier: string | null;
  universityId: string;
  universityAcronym: string | null;
  universityName: string | null;
  period: string | null;
}

export interface BusPass {
  id: string;
  studentId: string;
  studentName: string;
  studentRegistration: string | null;
  travelDate: CivilDate;
  travelDayOfWeek: string;
  mode: BusPassMode;
  status: BusPassStatus;
  outbound: BusPassLeg | null;
  inbound: BusPassLeg | null;
  reason: string | null;
  evidenceImageUrl: string | null;
  revisionReason: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  verificationCode: string | null;
  createdAt: string | null;
  approvedAt: string | null;
}

export interface BusPassSettings {
  monthlyQuota: number;
  minAdvanceHourBR: number;
  maxHorizonDays: number;
  /** Se `false`, só ADMIN opera a fila de passes. */
  employeeOperationEnabled: boolean;
  updatedByAdminId: string | null;
  updatedAt: string | null;
}

export interface UpdateBusPassSettingsPayload {
  monthlyQuota?: number;
  minAdvanceHourBR?: number;
  maxHorizonDays?: number;
  employeeOperationEnabled?: boolean;
}

/**
 * Detalhe do 409 de aprovação: diz qual perna lotou entre o pedido e a
 * aprovação, pra a tela oferecer negar ou devolver ao aluno.
 */
export interface BusPassCapacityConflict {
  leg: "outbound" | "inbound";
  busIdentifier: string | null;
  universityId: string;
}

export const BUS_PASS_STATUS_LABELS: Record<BusPassStatus, string> = {
  pending: "Pendente",
  revision: "Devolvido ao aluno",
  approved: "Aprovado",
  rejected: "Negado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const WEEKDAY_LABELS: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
};

export const weekdayLabel = (weekday: string): string =>
  WEEKDAY_LABELS[weekday] ?? weekday;

/**
 * `YYYY-MM-DD` → `DD/MM/AAAA` por split, não via `new Date()`: a string é uma
 * data civil de Brasília e construir um Date a leria como UTC, exibindo o dia
 * anterior no fuso do navegador.
 */
export const formatCivilDate = (date: CivilDate): string => {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

/** Hoje em Brasília, no formato civil — default dos filtros de data. */
export const todayInBR = (): CivilDate =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
