export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const SHIFT_LABEL: Record<string, string> = {
  "Manhã":    "Manhã",
  "Tarde":    "Tarde",
  "Noite":    "Noite",
  "Integral": "Integral",
  morning:   "Manhã",
  afternoon: "Tarde",
  evening:   "Noite",
  full:      "Integral",
  diurno:    "Diurno",
  noturno:   "Noturno",
} as const;

export function getShiftLabel(shift: string | null | undefined): string {
  if (!shift) return "—";
  return SHIFT_LABEL[shift] ?? shift;
}

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  pending: "Pendente",
} as const;
