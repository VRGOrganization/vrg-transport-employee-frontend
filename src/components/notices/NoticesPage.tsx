"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/Tabs";
import { CreateNoticeModal } from "./CreateNoticeModal";
import { NoticeListItem } from "./NoticeListItem";
import { UndoPublishBanner } from "./UndoPublishBanner";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

interface NoticesPageProps {
  role: "admin" | "employee";
}

type NoticeTab = "staff" | "system";

const TAB_ITEMS = [
  { key: "staff" as NoticeTab, label: "Enviadas por funcionários", icon: "person" },
  { key: "system" as NoticeTab, label: "Sistema", icon: "smart_toy" },
];

export function NoticesPage({ role }: NoticesPageProps) {
  void role;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [recentNotice, setRecentNotice] = useState<Notice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<NoticeTab>("staff");

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

  const visibleNotices = notices.filter((notice) =>
    tab === "system" ? notice.authorRole === "system" : notice.authorRole !== "system",
  );

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
        <div className="mx-auto w-full space-y-6">
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
              icon={<Plus className="size-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Criar aviso
            </Button>
          </header>

          {visibleRecentNotice && (
            <UndoPublishBanner notice={visibleRecentNotice} onUndo={handleUndo} />
          )}

          <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />

          <section className="space-y-3" aria-label="Lista de avisos">
            {loading && (
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                Carregando avisos...
              </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={loadNotices} />}

            {!loading && !error && visibleNotices.length === 0 && (
              <EmptyState
                icon={Bell}
                title="Nenhum aviso criado"
                description={
                  tab === "system"
                    ? "Nenhum aviso de sistema disparado ainda."
                    : "Crie uma mensagem ou enquete para estudantes."
                }
              />
            )}

            {!loading &&
              !error &&
              visibleNotices.map((notice) => (
                <NoticeListItem key={notice.id} notice={notice} onDeleted={handleDeleted} />
              ))}
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
