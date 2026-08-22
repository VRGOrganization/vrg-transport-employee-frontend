/** Um marco na linha do tempo: o banimento e, quando houve, a reativação. */
export interface BanHistoryEvent {
  type: "ban" | "unban";
  at: string;
  /** Nome do admin responsável; `null` quando a conta não existe mais. */
  byName: string | null;
  byId: string | null;
  reasons: string[];
}

/** Um ciclo completo de banimento (ban + eventual desbanimento). */
export interface BanHistoryEntry {
  banId: string;
  /** `true` enquanto o banimento não foi revertido. */
  active: boolean;
  bannedAt: string;
  bannedByName: string | null;
  bannedByAdminId: string;
  reasons: string[];
  unbannedAt: string | null;
  unbannedByName: string | null;
  unbannedByAdminId: string | null;
  unbanReasons: string[];
  events: BanHistoryEvent[];
}

export interface BanlistEntry {
  _id: string;
  email: string;
  name: string;
  socialName?: string | null;
  studentId: string;
  reasons: string[];
  bannedByAdminId: string;
  active: boolean;
  unbanReasons?: string[];
  unbannedByAdminId?: string;
  unbannedAt?: string;
  createdAt: string;
  updatedAt: string;
}
