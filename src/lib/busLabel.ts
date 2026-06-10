import type { Bus, BusRoute } from "@/types/university.types";

/**
 * Resolve o identificador textual de uma rota/ônibus para uso na aprovação
 * de carteirinhas (campo `bus` enviado ao backend).
 * Preferência: BusRoute.lineNumber → Bus.identifier → null.
 */
export function busLabel(route: BusRoute | Bus | null): string | null {
  if (!route) return null;
  return (route as BusRoute).lineNumber ?? (route as Bus).identifier ?? null;
}
