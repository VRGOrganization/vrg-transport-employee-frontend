"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/license-formatters";
import { DeleteNoticeButton } from "./DeleteNoticeButton";
import { PollResultsPanel } from "./PollResultsPanel";
import type { Notice, NoticeStatus, NoticeType } from "@/services/noticeService";

interface Props {
  notice: Notice;
  onDeleted: (noticeId: string) => void;
}

const TYPE_LABELS: Record<NoticeType, string> = {
  message: "Mensagem",
  poll: "Enquete",
};

const STATUS_LABELS: Record<NoticeStatus, string> = {
  scheduled: "Agendado",
  published: "Publicado",
  cancelled: "Cancelado",
  expired: "Encerrado",
};

const STATUS_CLASSES: Record<NoticeStatus, string> = {
  scheduled: "bg-info-container text-on-info",
  published: "bg-success-container text-success",
  cancelled: "bg-error-container text-error",
  expired: "bg-surface-container-high text-on-surface-variant",
};

export function NoticeListItem({ notice, onDeleted }: Props) {
  const [resultsOpen, setResultsOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
            {TYPE_LABELS[notice.type]}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[notice.status]}`}>
            {STATUS_LABELS[notice.status]}
          </span>
        </div>
        <p className="font-medium text-on-surface truncate">{notice.title}</p>
        <p className="text-xs text-on-surface-variant">
          {notice.authorName} · expira em {formatDate(notice.expiresAt)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {notice.type === "poll" && (
          <Button variant="outline" size="sm" onClick={() => setResultsOpen(true)}>
            Ver resultados
          </Button>
        )}
        {notice.authorRole !== "system" && notice.status !== "cancelled" && (
          <DeleteNoticeButton noticeId={notice.id} onDeleted={onDeleted} />
        )}
      </div>

      {resultsOpen && (
        <Modal open onClose={() => setResultsOpen(false)} title="Resultados da enquete" size="md">
          <PollResultsPanel noticeId={notice.id} status={notice.status} />
        </Modal>
      )}
    </div>
  );
}
