export function formatDateBR(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateLongBR(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatDateTimeBR(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

/**
 * Data de validade da carteirinha para um ciclo de inscrição.
 *
 * A base é SEMPRE o `cycleStartDate` (início real do ciclo) — nunca a data
 * da janela de inscrição nem a data de aprovação. O cálculo espelha exatamente o
 * `addMonthsBR` do backend, que usa `setUTCMonth` e, por isso, a formatação
 * também é feita em UTC (`timeZone: "UTC"`) para exibir o mesmo dia de
 * calendário que o backend persistiu.
 */
export function computeLicenseExpiry(
  cycleStartDate: string | null | undefined,
  months: number | null | undefined,
): string {
  if (!cycleStartDate || !months || months < 1) return "";
  const base = new Date(cycleStartDate);
  if (Number.isNaN(base.getTime())) return "";
  const result = new Date(base.getTime());
  result.setUTCMonth(result.getUTCMonth() + months); // idêntico ao addMonthsBR do backend
  return result.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function getGreeting(firstName: string): string {
  const h = new Date().getHours();
  const greeting = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${greeting}, ${firstName}`;
}
