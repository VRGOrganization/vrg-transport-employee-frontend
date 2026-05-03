import type { LicenseRequestRecord, StudentRecord } from "@/types/cards.types";

export interface EnrollmentPeriod {
  _id: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  filledSlots: number;
  licenseValidityMonths: number;
  active: boolean;
  createdByAdminId: string;
  closedByAdminId: string | null;
  closedAt: string | null;
  closedWaitlistCount?: number;
  waitlistClosedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistEntry {
  request: LicenseRequestRecord;
  student: StudentRecord;
  filaPosition: number;
}
