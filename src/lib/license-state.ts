import type { LicenseRequestStatus } from "@/lib/license-formatters";

export type EmployeeLicenseUiState =
  | { kind: "hasCard" }
  | { kind: "waitlisted"; position: number | null }
  | { kind: "pending" }
  | { kind: "rejected"; reason: string | null }
  | { kind: "approved" }
  | { kind: "noRequest" };

interface LicenseUiStateInput {
  hasCard: boolean;
  latestRequest: {
    status: LicenseRequestStatus;
    filaPosition?: number | null;
    rejectionReason?: string | null;
  } | null;
}

export function getLicenseUiState({ hasCard, latestRequest }: LicenseUiStateInput): EmployeeLicenseUiState {
  if (hasCard) return { kind: "hasCard" };
  if (!latestRequest) return { kind: "noRequest" };

  const { status, filaPosition, rejectionReason } = latestRequest;

  if (status === "waitlisted") return { kind: "waitlisted", position: filaPosition ?? null };
  if (status === "pending") return { kind: "pending" };
  if (status === "rejected") return { kind: "rejected", reason: rejectionReason ?? null };
  if (status === "approved") return { kind: "approved" };

  return { kind: "noRequest" };
}
