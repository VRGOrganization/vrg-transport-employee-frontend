"use client";

import { Modal } from "@/components/ui/Modal";
import type { BusPass } from "@/types/busPass";
import {
  BUS_PASS_STATUS_LABELS,
  formatCivilDate,
  weekdayLabel,
} from "@/types/busPass";

interface BusPassDetailModalProps {
  open: boolean;
  pass: BusPass | null;
  onClose: () => void;
}

function legLine(label: string, leg: BusPass["outbound"]): string | null {
  if (!leg) return null;
  const parts = [leg.busIdentifier ?? "?", "→", leg.universityAcronym ?? "?"];
  if (leg.period) parts.push(`(${leg.period})`);
  return `${label}: ${parts.join(" ")}`;
}

/**
 * A fila já traz `reason`/`revisionReason`/`rejectionReason`/
 * `cancellationReason`/`verificationCode` em cada linha (mesma view do
 * backend usada em `findOneForStaff`) — não precisa de uma segunda chamada
 * pra abrir o detalhe.
 */
export function BusPassDetailModal({ open, pass, onClose }: BusPassDetailModalProps) {
  if (!pass) return null;

  const legs = [legLine("Ida", pass.outbound), legLine("Volta", pass.inbound)].filter(
    (line): line is string => line !== null,
  );

  return (
    <Modal open={open} onClose={onClose} title="Detalhe do passe" size="md">
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-on-surface">{pass.studentName || "—"}</p>
          {pass.studentRegistration ? (
            <p className="text-xs text-on-surface-variant">{pass.studentRegistration}</p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-on-surface-variant">Viagem</dt>
            <dd className="text-on-surface">
              {formatCivilDate(pass.travelDate)} · {weekdayLabel(pass.travelDayOfWeek)}
              {pass.mode === "integral" ? " · integral" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-on-surface-variant">Status</dt>
            <dd className="text-on-surface">{BUS_PASS_STATUS_LABELS[pass.status]}</dd>
          </div>
        </dl>

        {legs.length > 0 ? (
          <div>
            <dt className="text-xs text-on-surface-variant">Ônibus</dt>
            <dd className="space-y-0.5 text-on-surface">
              {legs.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </dd>
          </div>
        ) : null}

        {pass.verificationCode ? (
          <div>
            <dt className="text-xs text-on-surface-variant">Código de verificação</dt>
            <dd className="font-mono text-on-surface">{pass.verificationCode}</dd>
          </div>
        ) : null}

        <div className="space-y-3 rounded-lg bg-surface-container-low p-3">
          <div>
            <dt className="text-xs font-medium text-on-surface-variant">
              Motivo do aluno
            </dt>
            <dd className="text-on-surface">{pass.reason || "Não informado."}</dd>
          </div>

          {pass.revisionReason ? (
            <div>
              <dt className="text-xs font-medium text-on-surface-variant">
                Motivo da devolução
              </dt>
              <dd className="text-on-surface">{pass.revisionReason}</dd>
            </div>
          ) : null}

          {pass.rejectionReason ? (
            <div>
              <dt className="text-xs font-medium text-on-surface-variant">
                Motivo da negação
              </dt>
              <dd className="text-on-surface">{pass.rejectionReason}</dd>
            </div>
          ) : null}

          {pass.cancellationReason ? (
            <div>
              <dt className="text-xs font-medium text-on-surface-variant">
                Motivo do cancelamento/revogação
              </dt>
              <dd className="text-on-surface">{pass.cancellationReason}</dd>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
