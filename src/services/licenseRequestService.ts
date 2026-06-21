import { http } from "./http";

export interface ReissueCandidate {
  allocationId: string;
  licenseRequestId: string;
  requestStatus: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  universityId: string;
  busId: string;
  busIdentifier: string | null;
  day: string;
  period: string;
  filaPosition: number | null;
  hasLicense: boolean;
  capacity: number;
  activeCount: number;
  availableSlots: number;
}

export interface LicenseRequestReviewCounts {
  enrollmentPeriodId: string | null;
  reissueCount: number;
  documentResendCount: number;
}

export interface ApproveReissueBody {
  allocationId?: string;
  day?: string;
  period?: string;
  institution?: string;
  photo?: string;
}

export interface ApproveReissueBatchTarget {
  allocationId?: string;
  day?: string;
  period?: string;
}

export interface ApproveReissueBatchBody {
  targets: ApproveReissueBatchTarget[];
  photo?: string;
}

export interface ApproveReissueBatchDay {
  allocationId: string | null;
  day: string;
  period: string;
}

export interface ApproveReissueBatchRefusal extends ApproveReissueBatchDay {
  reason: string;
}

export interface ApproveReissueBatchResult {
  requestId: string;
  licenseId: string | null;
  approved: ApproveReissueBatchDay[];
  refused: ApproveReissueBatchRefusal[];
}

export const licenseRequestService = {
  getReviewCounts: (periodId?: string) => {
    const query = periodId ? `?enrollmentPeriodId=${encodeURIComponent(periodId)}` : "";
    return http.get<LicenseRequestReviewCounts>(`/license-request/review-counts${query}`);
  },

  listReissueCandidates: (periodId?: string) => {
    const query = periodId ? `?enrollmentPeriodId=${encodeURIComponent(periodId)}` : "";
    return http.get<ReissueCandidate[]>(`/license-request/reissue-candidates${query}`);
  },

  approveReissue: (id: string, body: ApproveReissueBody) =>
    http.patch(`/license-request/${id}/approve-reissue`, body),

  approveReissueBatch: (id: string, body: ApproveReissueBatchBody) =>
    http.patch<ApproveReissueBatchResult>(`/license-request/${id}/approve-reissue-batch`, body),
};
