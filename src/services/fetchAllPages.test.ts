import { describe, expect, it, vi } from "vitest";
import { fetchAllPages, fetchTotal } from "./fetchAllPages";
import type { Paginated } from "@/types/api";

function makePage(
  data: number[],
  total: number,
  page: number,
  limit: number,
): Paginated<number> {
  return { data, total, page, limit };
}

describe("fetchAllPages", () => {
  it("devolve o array quando o endpoint não é paginado", async () => {
    const fetchPage = vi.fn(async () => [1, 2, 3] as Paginated<number>);

    const result = await fetchAllPages(fetchPage, 100);

    expect(result).toEqual([1, 2, 3]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("não busca páginas extras quando tudo cabe na primeira", async () => {
    const fetchPage = vi.fn(async () => makePage([1, 2], 2, 1, 100));

    const result = await fetchAllPages(fetchPage, 100);

    expect(result).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("percorre três páginas preservando a ordem", async () => {
    const pages: Record<number, number[]> = {
      1: [1, 2],
      2: [3, 4],
      3: [5],
    };
    const fetchPage = vi.fn(async (page: number) =>
      makePage(pages[page] ?? [], 5, page, 2),
    );

    const result = await fetchAllPages(fetchPage, 2);

    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("preserva a ordem mesmo quando as páginas resolvem fora de ordem", async () => {
    const pages: Record<number, number[]> = { 1: [1], 2: [2], 3: [3] };
    // Página 2 demora mais que a 3: Promise.all resolve fora de ordem, mas o
    // resultado tem de sair ordenado.
    const fetchPage = vi.fn(async (page: number) => {
      await new Promise((r) => setTimeout(r, page === 2 ? 20 : 1));
      return makePage(pages[page] ?? [], 3, page, 1);
    });

    const result = await fetchAllPages(fetchPage, 1);

    expect(result).toEqual([1, 2, 3]);
  });

  it("não entra em laço quando o total é inconsistente com os dados", async () => {
    // total mente (diz 1000) mas as páginas seguintes vêm vazias.
    const fetchPage = vi.fn(async (page: number) =>
      makePage(page === 1 ? [1, 2] : [], 1000, page, 2),
    );

    const result = await fetchAllPages(fetchPage, 2);

    expect(result).toEqual([1, 2]);
    // Um total inflado não pode virar centenas de requisições: o fan-out é
    // limitado (1 primeira + MAX_EXTRA_PAGES).
    expect(fetchPage).toHaveBeenCalledTimes(41);
  });

  it("respeita o hardCap", async () => {
    const fetchPage = vi.fn(async (page: number) =>
      makePage([page * 10, page * 10 + 1], 100, page, 2),
    );

    const result = await fetchAllPages(fetchPage, 2, 5);

    expect(result).toHaveLength(5);
  });

  it("usa o limit ecoado pelo backend quando ele faz clamp", async () => {
    // Pedimos 5000, o backend devolve limit 1000 (o teto real).
    const fetchPage = vi.fn(async (page: number) =>
      makePage(Array.from({ length: 1000 }, (_, i) => page * 1000 + i), 2000, page, 1000),
    );

    const result = await fetchAllPages(fetchPage, 5000);

    expect(result).toHaveLength(2000);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenLastCalledWith(2, 1000);
  });
});

describe("fetchTotal", () => {
  it("lê o total sem trazer os registros", async () => {
    const fetchPage = vi.fn(async () => makePage([1], 742, 1, 1));

    await expect(fetchTotal(fetchPage)).resolves.toBe(742);
    expect(fetchPage).toHaveBeenCalledWith(1, 1);
  });

  it("cai no tamanho do array quando não há total", async () => {
    const fetchPage = vi.fn(async () => [1, 2, 3] as Paginated<number>);

    await expect(fetchTotal(fetchPage)).resolves.toBe(3);
  });
});
