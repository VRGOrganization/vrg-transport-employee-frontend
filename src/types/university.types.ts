import type { BusShift } from "@/lib/validation/bus";
export interface University {
  _id: string;
  name: string;
  acronym: string;
  address: string;
  active: boolean;
  /** Faculdade temporária criada no fluxo interno (oculta para o aluno). */
  temporary?: boolean;
  createdAt: string;
  updatedAt: string;
  pendingCount?: number;
  revisionCount?: number;
  waitlistedCount?: number;
  // Presente na listagem (GET /university): true se existe ao menos um Bus
  // cobrindo essa faculdade. Ausente em respostas antigas/mockadas.
  hasBus?: boolean;
  /** Id do ator que desativou (userId); `null`/ausente quando ativa. */
  deactivatedBy?: string | null;
  deactivatedAt?: string | null;
}

export type CourseModel = "Técnico" | "Tecnólogo" | "Bacharel" | "Licenciatura" | "Mestrado" | "Doutorado";

export const COURSE_MODEL_OPTIONS: CourseModel[] = ["Técnico", "Tecnólogo", "Bacharel", "Licenciatura", "Mestrado", "Doutorado"];

export interface Course {
  _id: string;
  name: string;
  universityId: string | { _id: string; name: string; acronym: string };
  model: CourseModel | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** Id do ator que desativou (userId); `null`/ausente quando ativo. */
  deactivatedBy?: string | null;
  /** Nome do ator resolvido pelo backend (aba "Cursos desativados"). */
  deactivatedByName?: string | null;
  deactivatedAt?: string | null;
}

/** Contador de vagas ocupadas de um vínculo faculdade+ônibus em um dia. */
export interface DaySlotCount {
  day: string;
  filledSlots: number;
}

export interface UniversitySlot {
  universityId: string | { _id: string; name: string; acronym: string };
  priorityOrder: number;
  filledSlots?: number;
  /**
   * Vagas ocupadas por dia por esta faculdade. `bus.capacity` é o teto do
   * ônibus inteiro no dia: a soma de todas as faculdades nunca passa dele.
   * Contador vivo do ciclo ATIVO: zerado no reset, não serve para histórico.
   */
  daySlots?: DaySlotCount[];
  pendingCount?: number;
  waitlistedCount?: number;
}

export interface Bus {
  _id: string;
  identifier: string;
  // Vagas do ônibus por dia, compartilhadas entre as faculdades. Obrigatória
  // no cadastro; `null` só aparece em dado antigo.
  capacity?: number | null;
  // nova estrutura com prioridades e contadores
  universitySlots?: UniversitySlot[];
  // mantemos universityIds para compatibilidade legada
  universityIds?: Array<{ _id: string; name: string; acronym: string }>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Turno do ônibus ('Manhã' ou 'Noite'). Obrigatório no cadastro; dado
  // antigo pode vir vazio ou com 'Tarde'.
  shift?: string | null;
  // contadores expostos pela API de listagem com filas
  waitlistedCount?: number;
  /** Alocações ativas no ciclo (GET /bus/queue). */
  activeCount?: number;
  pendingCount?: number;
  filledSlotsTotal?: number;
}

/** Payload de `POST /bus`: turno e capacidade são obrigatórios. */
export interface BusCreateInput {
  identifier: string;
  shift: BusShift;
  capacity: number;
}

/** Payload de `PATCH /bus/:id`: ausente = não alterar; nunca `null`. */
export type BusUpdateInput = Partial<BusCreateInput>;

export interface BusStudent {
  _id: string;
  name: string;
  socialName?: string | null;
  email: string;
  shift?: string;
  institution?: string;
  degree?: string;
  // agora o backend pode retornar `busId` e `universityId`
  busId?: string;
  universityId?:
    | string
    | {
        _id: string;
        name?: string;
        acronym?: string;
      };
  days?: string[];
}

export interface BusRouteDestination {
  name: string;
  nameNormalized?: string;
  active: boolean;
}

export interface BusRoute {
  _id: string;
  lineNumber: string;
  destinations: BusRouteDestination[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusQueueSummarySlot {
  universityId: string;
  priorityOrder: number;
  filledSlots: number;
  pendingCount: number;
  waitlistedCount: number;
}

export interface BusQueueSummary {
  _id: string;
  identifier: string;
  shift: string | null;
  capacity: number | null;
  filledSlotsTotal: number;
  availableSlots: number | null;
  pendingRequests: unknown[];
  waitlistedRequests: unknown[];
  universitySlots?: BusQueueSummarySlot[];
}
