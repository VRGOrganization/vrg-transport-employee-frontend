export type Paginated<T> = T[] | { data?: T[]; total?: number; page?: number; limit?: number };

export function resolvePaginated<T>(payload: Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
}

export interface ApiError {
  message: string;
  status?: number;
}
