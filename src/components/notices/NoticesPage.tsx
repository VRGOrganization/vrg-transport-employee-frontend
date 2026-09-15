"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, SearchX, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { CheckboxFilter } from "@/components/ui/CheckboxFilter";
import { PAGE_SIZE_OPTIONS, type PageSize } from "@/lib/constants";
import { CreateNoticeModal } from "./CreateNoticeModal";
import { NoticeListItem } from "./NoticeListItem";
import { UndoPublishBanner } from "./UndoPublishBanner";
import { noticeService } from "@/services/noticeService";
import type { Notice, NoticeStatus, NoticeType } from "@/services/noticeService";

interface NoticesPageProps {
  role: "admin" | "employee";
}

type NoticeTab = "staff" | "system";

const TAB_ITEMS = [
  { key: "staff" as NoticeTab, label: "Enviadas pela equipe", icon: "person" },
  { key: "system" as NoticeTab, label: "Sistema", icon: "smart_toy" },
];

const DEFAULT_PAGE_SIZE: PageSize = PAGE_SIZE_OPTIONS[0];

const TYPE_FILTER_OPTIONS: { key: NoticeType; label: string }[] = [
  { key: "message", label: "Mensagem" },
  { key: "poll", label: "Enquete" },
];

const STATUS_FILTER_OPTIONS: { key: NoticeStatus; label: string }[] = [
  { key: "scheduled", label: "Agendado" },
  { key: "published", label: "Publicado" },
  { key: "cancelled", label: "Cancelado" },
  { key: "expired", label: "Encerrado" },
];

export function NoticesPage({ role }: NoticesPageProps) {
  void role;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [recentNotice, setRecentNotice] = useState<Notice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<NoticeTab>("staff");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [typeFilter, setTypeFilter] = useState<Set<NoticeType>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<NoticeStatus>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await noticeService.listNotices();
      setNotices(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Não foi possível carregar os avisos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  const visibleRecentNotice = useMemo(() => {
    if (!recentNotice || recentNotice.status !== "scheduled") return null;
    return recentNotice;
  }, [recentNotice]);

  const handleCreated = (notice: Notice) => {
    setRecentNotice(notice);
    setNotices((current) => [notice, ...current.filter((item) => item.id !== notice.id)]);
  };

  const handleDeleted = (noticeId: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== noticeId));
    setRecentNotice((current) => (current?.id === noticeId ? null : current));
  };

  const handleUpdated = (updated: Notice) => {
    setNotices((current) =>
      current.map((notice) => (notice.id === updated.id ? updated : notice)),
    );
  };

  const tabNotices = useMemo(
    () =>
      notices.filter((notice) =>
        tab === "system" ? notice.authorRole === "system" : notice.authorRole !== "system",
      ),
    [notices, tab],
  );

  const visibleNotices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tabNotices.filter((notice) => {
      if (query && !notice.title.toLowerCase().includes(query)) return false;
      if (typeFilter.size > 0 && !typeFilter.has(notice.type)) return false;
      if (statusFilter.size > 0 && !statusFilter.has(notice.status)) return false;
      return true;
    });
  }, [tabNotices, search, typeFilter, statusFilter]);

  const activeFilterCount = typeFilter.size + statusFilter.size;

  const totalNotices = visibleNotices.length;
  const paginatedNotices = useMemo(
    () => visibleNotices.slice((page - 1) * pageSize, page * pageSize),
    [visibleNotices, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [tab, search, typeFilter, statusFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalNotices / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [totalNotices, pageSize, page]);

  useEffect(() => {
    if (!filtersOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filtersOpen]);

  const toggleTypeFilter = (type: NoticeType, checked: boolean) => {
    setTypeFilter((current) => {
      const next = new Set(current);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
  };

  const toggleStatusFilter = (status: NoticeStatus, checked: boolean) => {
    setStatusFilter((current) => {
      const next = new Set(current);
      if (checked) next.add(status);
      else next.delete(status);
      return next;
    });
  };

  const clearFilters = () => {
    setTypeFilter(new Set());
    setStatusFilter(new Set());
  };

  const handleUndo = () => {
    if (!recentNotice) return;
    setNotices((current) =>
      current.map((notice) =>
        notice.id === recentNotice.id ? { ...notice, status: "cancelled" } : notice,
      ),
    );
    setRecentNotice(null);
  };

  return (
    <>
      <main className="bg-surface flex flex-col flex-1 px-6 py-8 md:px-10">
        <div className="w-full space-y-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Avisos</p>
              <h1 className="font-headline text-2xl font-semibold text-on-surface">
                Comunicados e enquetes
              </h1>
              <p className="max-w-2xl text-sm text-on-surface-variant">
                Gerencie mensagens e votações visíveis para estudantes.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              Adicionar aviso
            </Button>
          </header>

          {visibleRecentNotice && (
            <UndoPublishBanner
              notice={visibleRecentNotice}
              onUndo={handleUndo}
              onExpire={() => { setRecentNotice(null); void loadNotices(); }}
            />
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative" ref={filtersRef}>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors cursor-pointer ${
                    activeFilterCount > 0
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <ListFilter className="size-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {filtersOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 shadow-xl">
                    <div className="flex items-center justify-between px-1 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Filtrar por
                      </span>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-xs font-medium text-primary hover:underline cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    <p className="px-1 pb-1 text-[11px] font-semibold text-on-surface-variant">Tipo</p>
                    <div className="flex flex-col">
                      {TYPE_FILTER_OPTIONS.map((opt) => (
                        <CheckboxFilter
                          key={opt.key}
                          label={opt.label}
                          checked={typeFilter.has(opt.key)}
                          onChange={(checked) => toggleTypeFilter(opt.key, checked)}
                        />
                      ))}
                    </div>

                    <p className="px-1 pb-1 pt-2 text-[11px] font-semibold text-on-surface-variant">Status</p>
                    <div className="flex flex-col">
                      {STATUS_FILTER_OPTIONS.map((opt) => (
                        <CheckboxFilter
                          key={opt.key}
                          label={opt.label}
                          checked={statusFilter.has(opt.key)}
                          onChange={(checked) => toggleStatusFilter(opt.key, checked)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar por título..."
                className="w-full sm:w-72"
              />
            </div>
          </div>

          <section className="flex flex-col gap-4" aria-label="Lista de avisos">
            {loading && (
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                Carregando avisos...
              </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={loadNotices} />}

            {!loading && !error && totalNotices === 0 && (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-10">
                <EmptyState
                  icon={search.trim() || activeFilterCount > 0 ? SearchX : Bell}
                  title={
                    search.trim() || activeFilterCount > 0
                      ? "Nenhum aviso encontrado"
                      : "Nenhum aviso criado"
                  }
                  description={
                    search.trim() || activeFilterCount > 0
                      ? "Tente ajustar a busca ou os filtros selecionados."
                      : tab === "system"
                        ? "Nenhum aviso de sistema disparado ainda."
                        : "Crie uma mensagem ou enquete para estudantes."
                  }
                />
              </div>
            )}

            {!loading && !error && totalNotices > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paginatedNotices.map((notice) => (
                  <NoticeListItem
                    key={notice.id}
                    notice={notice}
                    onDeleted={handleDeleted}
                    onUpdated={handleUpdated}
                  />
                ))}
              </div>
            )}

            {!loading && !error && totalNotices > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={totalNotices}
                onPageChange={setPage}
                onPageSizeChange={(size) => setPageSize(size as PageSize)}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3"
              />
            )}
          </section>
        </div>
      </main>

      <CreateNoticeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
