"use client";

import type { AuditEvent } from "@/types/audit";
import { AuditNode } from "./AuditNode";

interface AuditTimelineProps {
  events: AuditEvent[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (event: AuditEvent) => void;
}

/**
 * Timeline vertical estilo `git log --graph`: um trilho contínuo à esquerda com
 * nós coloridos por categoria. Clique no card abre o detalhe; o botão
 * "Selecionar" (ou duplo clique) marca o card com destaque — sem checkbox.
 */
export function AuditTimeline({
  events,
  selectedIds,
  onToggleSelect,
  onOpen,
}: AuditTimelineProps) {
  return (
    <div className="pl-1">
      {events.map((event, index) => (
        <AuditNode
          key={event.id}
          event={event}
          selected={selectedIds.has(event.id)}
          isFirst={index === 0}
          isLast={index === events.length - 1}
          onToggleSelect={onToggleSelect}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
