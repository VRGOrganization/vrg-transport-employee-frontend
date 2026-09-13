export interface AuditActor {
  id?: string;
  role?: string;
  identifier?: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  outcome: "success" | "failure";
  actor: AuditActor | null;
  target: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorName: string | null;
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  /** Match exato de uma ação (ex.: `student.ban`). */
  action?: string;
  /** Match por categoria (prefixo, ex.: `student.`). */
  actionPrefix?: string;
  actorId?: string;
  /** CSV de papéis do ator (ex.: "admin,employee" para apenas funcionários). */
  actorRoles?: string;
  outcome?: "success" | "failure";
  from?: string;
  to?: string;
}

/** Pessoa presente nos logs, para os selects de filtro. */
export interface AuditParticipant {
  id: string;
  name: string | null;
  role: string;
  isStaff: boolean;
}
