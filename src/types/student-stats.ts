export interface ShiftStats {
  morning: number;
  afternoon: number;
  night: number;
  fullTime: number;
}

export interface DayUsageStats {
  SEG: number;
  TER: number;
  QUA: number;
  QUI: number;
  SEX: number;
}

export interface BreakdownEntry {
  id: string;
  count: number;
}

export interface StudentDashboardStats {
  totalStudents: number;
  studentsWithCard: number;
  studentsWithoutCard: number;
  studentsWithPendingRequest: number;
  transport: {
    byShift: ShiftStats;
    byDay: DayUsageStats;
    totalUsing: number;
    /** Alunos com carteirinha ativa, contados por ônibus (ordenado desc.). */
    byBus: BreakdownEntry[];
    /** Alunos com carteirinha ativa, contados por faculdade (ordenado desc.). */
    byUniversity: BreakdownEntry[];
  };
  generatedAt: string;
}