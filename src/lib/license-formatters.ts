export type LicenseRequestStatus = "pending" | "approved" | "rejected" | "waitlisted";
export type LicenseStatus = "active" | "inactive" | "expired";

export function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(dateValue: string | null | undefined): string {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

export function licenseRequestStatusLabel(status: LicenseRequestStatus): string {
  const labels: Record<LicenseRequestStatus, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Recusado",
    waitlisted: "Na fila",
  };
  return labels[status] ?? status;
}

export function licenseRequestStatusBadgeClass(status: LicenseRequestStatus): string {
  const classes: Record<LicenseRequestStatus, string> = {
    pending: "bg-warning/20 text-warning",
    approved: "bg-success/15 text-success",
    rejected: "bg-error/15 text-error",
    waitlisted: "bg-warning-container text-on-warning",
  };
  return classes[status] ?? "bg-outline-variant/30 text-on-surface-variant";
}

export function licenseStatusLabel(status: LicenseStatus): string {
  const labels: Record<LicenseStatus, string> = {
    active: "Ativa",
    inactive: "Inativa",
    expired: "Expirada",
  };
  return labels[status] ?? status;
}
