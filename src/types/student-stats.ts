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

export interface StudentDashboardStats {
  totalStudents: number;
  studentsWithCard: number;
  studentsWithoutCard: number;
  studentsWithPendingRequest: number;
  transport: {
    byShift: ShiftStats;
    byDay: DayUsageStats;
    totalUsing: number;
  };
  generatedAt: string;
}