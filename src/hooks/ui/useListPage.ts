"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { type PageSize } from "@/lib/constants";

interface UseListPageOptions<T, Tab extends string> {
  tabs: readonly Tab[];
  initialTab: Tab;
  fetcher: (tab: Tab) => Promise<T[]>;
  searchFields: (item: T) => string[];
  errorMessage?: string;
  reloadOnTabChange?: boolean;
  sortFn?: (a: T, b: T) => number;
  /** Filtro extra além da busca (ex.: filtros de toolbar). Mudar a função não refaz o fetch. */
  filterFn?: (item: T) => boolean;
}

export function useListPage<T, Tab extends string>({
  tabs,
  initialTab,
  fetcher,
  searchFields,
  errorMessage = "Não foi possível carregar os dados",
  reloadOnTabChange = false,
  sortFn,
  filterFn,
}: UseListPageOptions<T, Tab>) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [items, setItems] = useState<Record<Tab, T[] | null>>(
    () => Object.fromEntries(tabs.map((t) => [t, null])) as Record<Tab, T[] | null>,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearchRaw] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState<PageSize>(10);

  const load = useCallback(
    async (t: Tab) => {
      setLoading(true);
      setError("");
      try {
        const data = await fetcher(t);
        setItems((prev) => ({ ...prev, [t]: data }));
      } catch {
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fetcher, errorMessage],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(initialTab); }, []);

  const handleTabChange = useCallback(
    (t: Tab) => {
      setTab(t);
      setSearchRaw("");
      setPage(1);
      if (reloadOnTabChange || items[t] === null) {
        load(t);
      } else {
        setLoading(false);
      }
    },
    [items, load, reloadOnTabChange],
  );

  const current = items[tab] ?? [];

  const filtered = useMemo(() => {
    let result = search.trim()
      ? current.filter((item) => {
          const q = search.toLowerCase();
          return searchFields(item).some((f) => f.toLowerCase().includes(q));
        })
      : current;
    if (filterFn) result = result.filter(filterFn);
    if (sortFn) result = [...result].sort(sortFn);
    return result;
  }, [current, search, searchFields, sortFn, filterFn]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPage(1);
  }, []);

  const setPageSize = useCallback((s: PageSize) => {
    setPageSizeRaw(s);
    setPage(1);
  }, []);

  const reload = useCallback(() => load(tab), [load, tab]);

  // Recarrega aba atual e invalida cache das demais (re-fetch lazy no próximo switch)
  const reloadAll = useCallback(() => {
    setItems((prev) =>
      Object.fromEntries(tabs.map((t) => [t, t === tab ? prev[t] : null])) as Record<Tab, T[] | null>,
    );
    load(tab);
  }, [load, tab, tabs]);

  return {
    tab,
    setTab: handleTabChange,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    filtered,
    paginated,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    reload,
    reloadAll,
  };
}
