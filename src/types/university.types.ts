export interface University {
  _id: string;
  name: string;
  acronym: string;
  address: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  name: string;
  universityId: string | { _id: string; name: string; acronym: string };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UniversitySlot {
  universityId: string | { _id: string; name: string; acronym: string };
  priorityOrder: number;
  filledSlots?: number;
  pendingCount?: number;
  waitlistedCount?: number;
}

export interface Bus {
  _id: string;
  identifier: string;
  // capacidade opcional — se ausente, sem limite
  capacity?: number | null;
  // nova estrutura com prioridades e contadores
  universitySlots?: UniversitySlot[];
  // mantemos universityIds para compatibilidade legada
  universityIds?: Array<{ _id: string; name: string; acronym: string }>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // período/turno principal do ônibus (ex.: 'Manhã', 'Tarde', 'Noite')
  shift?: string | null;
  // contadores expostos pela API de listagem com filas
  waitlistedCount?: number;
  pendingCount?: number;
  filledSlotsTotal?: number;
}

export interface BusStudent {
  _id: string;
  name: string;
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
