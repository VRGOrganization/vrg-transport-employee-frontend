import type { Paginated } from "@/types/api";

/**
 * Percorre um endpoint paginado até cobrir `total`.
 *
 * Existe porque TODA listagem do backend tem `limit` padrão 20: buscar sem
 * paginar (o que a página de estatísticas antiga fazia) trunca o dataset em 20
 * registros e produz números silenciosamente errados.
 *
 * @param fetchPage  busca uma página específica.
 * @param maxLimit   teto de `limit` do endpoint (100 na maioria; 1000 em
 *                   /license-request). Pedir acima do teto não quebra — o
 *                   backend faz clamp —, mas subestimar custa requisições.
 * @param hardCap    trava de segurança contra `total` inconsistente.
 */
/**
 * Teto de páginas extras por chamada. Um `total` inflado não pode virar
 * centenas de requisições paralelas contra a API — o `hardCap` limita o
 * resultado, mas só isto limita o tráfego.
 */
const MAX_EXTRA_PAGES = 40;

export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<Paginated<T>>,
  maxLimit: number,
  hardCap = 50_000,
): Promise<T[]> {
  const first = await fetchPage(1, maxLimit);

  // Endpoint sem paginação (devolve array puro): já veio tudo.
  if (Array.isArray(first)) return first.slice(0, hardCap);

  const data = Array.isArray(first.data) ? first.data : [];
  const total = typeof first.total === "number" ? first.total : data.length;
  // O backend faz clamp do limit; usar o valor ECOADO evita calcular o número
  // de páginas com um tamanho que o servidor não aplicou.
  const limit =
    typeof first.limit === "number" && first.limit > 0 ? first.limit : maxLimit;

  const cap = Math.min(total, hardCap);
  if (data.length >= cap || data.length === 0) return data.slice(0, hardCap);

  const totalPages = Math.ceil(cap / limit);
  const extraPages = Math.min(totalPages - 1, MAX_EXTRA_PAGES);
  const rest = await Promise.all(
    Array.from({ length: extraPages }, (_, i) => fetchPage(i + 2, limit)),
  );

  // Preserva a ordem das páginas: Promise.all resolve fora de ordem, o array
  // não.
  const out = [...data];
  for (const page of rest) {
    const rows = Array.isArray(page) ? page : (page.data ?? []);
    out.push(...rows);
    if (out.length >= hardCap) break;
  }
  return out.slice(0, hardCap);
}

/**
 * Lê apenas o `total` de um endpoint paginado, sem trazer os registros.
 * Usado no censo (alunos/funcionários inativos), onde só o número importa.
 */
export async function fetchTotal<T>(
  fetchPage: (page: number, limit: number) => Promise<Paginated<T>>,
): Promise<number> {
  const res = await fetchPage(1, 1);
  if (Array.isArray(res)) return res.length;
  return typeof res.total === "number" ? res.total : (res.data?.length ?? 0);
}
