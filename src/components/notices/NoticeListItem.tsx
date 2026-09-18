"use client";

import { useState } from "react";
import { MessageSquare, BarChart3, Pin } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/license-formatters";
import { DeleteNoticeButton } from "./DeleteNoticeButton";
import { PollResultsPanel } from "./PollResultsPanel";
import { ResendNoticeButton } from "./ResendNoticeButton";
import { TogglePinButton } from "./TogglePinButton";
import type { Notice, NoticeStatus, NoticeType } from "@/services/noticeService";

interface Props {
  notice: Notice;
  onDeleted: (noticeId: string) => void;
  onUpdated: (notice: Notice) => void;
}

const TYPE_LABELS: Record<NoticeType, string> = {
  message: "Mensagem",
  poll: "Enquete",
};

const TYPE_ICONS: Record<NoticeType, typeof MessageSquare> = {
  message: MessageSquare,
  poll: BarChart3,
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

export function NoticeListItem({ notice, onDeleted, onUpdated }: Props) {
  const [resultsOpen, setResultsOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const TypeIcon = TYPE_ICONS[notice.type];

  return (
    <div className="group flex h-full flex-col gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 transition-colors hover:border-outline-variant hover:bg-surface-container-low/40">
      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        className="flex items-start gap-3 -m-1 rounded-lg p-1 text-left cursor-pointer hover:bg-surface-container-high/60 transition-colors"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
          <TypeIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium text-on-surface">{notice.title}</p>
            {notice.pinned && (
              <Pin className="size-3.5 shrink-0 fill-primary text-primary" aria-label="Fixado" />
            )}
          </div>
          <p className="truncate text-xs text-on-surface-variant">
            {notice.authorName} · expira em {formatDate(notice.expiresAt)}
          </p>
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
          {TYPE_LABELS[notice.type]}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[notice.status]}`}>
          {STATUS_LABELS[notice.status]}
        </span>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1">
        {notice.type === "poll" && (
          <Button variant="outline" size="sm" onClick={() => setResultsOpen(true)}>
            Ver resultados
          </Button>
        )}
        {notice.status === "published" && (
          <TogglePinButton
            noticeId={notice.id}
            pinned={notice.pinned}
            onToggled={onUpdated}
          />
        )}
        {notice.status === "published" && <ResendNoticeButton noticeId={notice.id} />}
        <DeleteNoticeButton noticeId={notice.id} onDeleted={onDeleted} />
      </div>

      {resultsOpen && (
        <Modal open onClose={() => setResultsOpen(false)} title="Resultados da enquete" size="md">
          <PollResultsPanel noticeId={notice.id} status={notice.status} />
        </Modal>
      )}

      {detailOpen && (
        <Modal open onClose={() => setDetailOpen(false)} title={notice.title} size="md">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
              <span className={`rounded-full px-2.5 py-0.5 font-medium ${STATUS_CLASSES[notice.status]}`}>
                {STATUS_LABELS[notice.status]}
              </span>
              <span>{notice.authorName}</span>
              <span>·</span>
              <span>expira em {formatDate(notice.expiresAt)}</span>
            </div>

            {notice.body ? (
              <p className="whitespace-pre-wrap text-sm text-on-surface">{notice.body}</p>
            ) : (
              <p className="text-sm text-on-surface-variant">Sem conteúdo adicional.</p>
            )}

            {notice.type === "poll" && notice.pollOptions && notice.pollOptions.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {notice.pollOptions.map((option) => (
                  <li
                    key={option.id}
                    className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface"
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
