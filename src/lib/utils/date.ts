const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

const brCivilFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BRAZIL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const brOffsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BRAZIL_TIME_ZONE,
  timeZoneName: "longOffset",
});

/** Offset de Brasília em minutos no instante dado (negativo a oeste). */
function brOffsetMinutes(instant: Date): number {
  const label = brOffsetFormatter
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;

  // `longOffset` devolve 'GMT-03:00'; 'GMT' puro significa offset zero.
  const match = label?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;

  const [, sign, hh, mm] = match;
  const magnitude = Number(hh) * 60 + Number(mm);
  return sign === "-" ? -magnitude : magnitude;
}

/**
 * A data civil (`YYYY-MM-DD`) de hoje em Brasília — o mesmo dia que o usuário
 * vê no calendário, não o dia em UTC. Serve de `min` nos inputs de data.
 */
export function todayCivilBR(): string {
  return brCivilFormatter.format(new Date());
}

/** A data civil de um instante ISO qualquer, em Brasília. */
export function toCivilBR(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";
  return brCivilFormatter.format(date);
}

function brInstantISO(civilDate: string, time: string): string {
  const naive = new Date(`${civilDate}T${time}Z`);
  if (Number.isNaN(naive.getTime())) return "";
  return new Date(
    naive.getTime() - brOffsetMinutes(naive) * 60_000,
  ).toISOString();
}

/**
 * Instante ISO da meia-noite **de Brasília** na data civil dada.
 *
 * O `<input type="date">` devolve uma data civil ("2026-08-21"), que não é um
 * instante. Mandar `2026-08-21T00:00:00.000Z` grava 21h do dia 20 no horário
 * de Brasília — e a data volta um dia ao ser exibida. Por isso o offset entra
 * aqui, lido do próprio Intl (nada de `-3` cravado).
 */
export function brDayStartISO(civilDate: string): string {
  return brInstantISO(civilDate, "00:00:00.000");
}

/** Instante ISO do último milissegundo do dia em Brasília. */
export function brDayEndISO(civilDate: string): string {
  return brInstantISO(civilDate, "23:59:59.999");
}

export function formatDateBR(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: BRAZIL_TIME_ZONE });
}

export function formatDateLongBR(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTimeBR(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { timeZone: BRAZIL_TIME_ZONE });
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
