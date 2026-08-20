import type { LicenseRequestRecord, StudentRecord } from "@/types/cards.types";

/**
 * "scheduled" = ciclo criado com data futura que ainda não começou; o backend
 * o promove a "active" na data. `active` continua espelhando `status === "active"`.
 */
export type EnrollmentCycleStatus = "scheduled" | "active" | "closed";

export interface EnrollmentPeriod {
  _id: string;
  startDate: string | null;
  endDate: string | null;
  // Data de início real do ciclo, sem a sobrescrita de startDate pela janela
  // atualmente aberta — base do cálculo de validade da carteirinha. Sempre
  // presente (o backend nunca omite), diferente de startDate/endDate que
  // podem vir null quando não há janela aberta no momento.
  cycleStartDate: string;
  totalSlots: number;
  filledSlots: number;
  licenseValidityMonths: number;
  active: boolean;
  status: EnrollmentCycleStatus;
  createdByAdminId: string;
  closedByAdminId: string | null;
  closedAt: string | null;
  closedWaitlistCount?: number;
  waitlistClosedAt?: string | null;
  resetScheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export type EnrollmentWindowEligibilityScope =
  | "all"
  | "has_university"
  | "specific_universities";

export interface EnrollmentWindow {
  _id: string;
  enrollmentCycleId: string;
  startDate: string;
  endDate: string;
  active: boolean;
  eligibilityScope: EnrollmentWindowEligibilityScope;
  eligibleUniversityIds: string[] | null;
}

export interface WaitlistEntry {
  request: LicenseRequestRecord;
  student: StudentRecord;
  filaPosition: number;
}
