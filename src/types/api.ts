export type Paginated<T> = T[] | { data?: T[]; total?: number; page?: number; limit?: number };

export function resolvePaginated<T>(payload: Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
}

export interface ApiError {
  message: string;
  status?: number;
  retryAfterMs?: number | null;
  /**
   * Corpo bruto da resposta de erro. Alguns casos de negócio devolvem contexto
   * estruturado além da mensagem — o 409 de passe lotado traz `conflict`
   * dizendo qual perna encheu, que a tela usa pra oferecer negar ou devolver.
   */
  details?: unknown;
}
