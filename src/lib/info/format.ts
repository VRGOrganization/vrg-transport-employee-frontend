export { formatDateBR, formatDateTimeBR } from "@/lib/utils/date";

/** Número em pt-BR com separador de milhar. Todo número da página passa aqui. */
export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

/** Percentual inteiro. Não arredonda para fechar 100 — mostra o que é. */
export function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

/** Hora curta (HH:MM) para o carimbo de última leitura. */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Plural simples em português: `plural(1, "aluno")` → "1 aluno". */
export function plural(
  count: number,
  singular: string,
  pluralForm = `${singular}s`,
): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

/** Dias restantes até uma data (negativo quando já passou). */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const MS_PER_DAY = 86_400_000;
  return Math.ceil((target.getTime() - Date.now()) / MS_PER_DAY);
}

/** Nome do arquivo de exportação: informacoes-<ciclo|data>-<AAAAMMDD-HHmm>. */
export function exportFileName(
  extension: string,
  cycleLabel: string | null,
): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const slug = (cycleLabel ?? "recorte")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `informacoes-${slug || "recorte"}-${stamp}.${extension}`;
}
