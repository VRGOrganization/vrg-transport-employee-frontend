import { BadgeCheck, Calendar, QrCode, Hash } from "lucide-react";
import type { LicenseRecord } from "@/types/cards.types";

interface LicenseDetailsCardProps {
  license: LicenseRecord;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function getDaysUntilExpiry(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:   { label: "Ativa",     className: "bg-success/10 text-success" },
  inactive: { label: "Inativa",   className: "bg-outline-variant/20 text-on-surface-variant" },
  expired:  { label: "Expirada",  className: "bg-error/10 text-error" },
  rejected: { label: "Rejeitada", className: "bg-error/10 text-error" },
};

export function LicenseDetailsCard({ license }: LicenseDetailsCardProps) {
  const daysUntilExpiry = getDaysUntilExpiry(license.expirationDate);
  const statusConfig = STATUS_CONFIG[license.status] ?? STATUS_CONFIG.inactive;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 space-y-2">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BadgeCheck className="size-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Carteirinha emitida
          </p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="space-y-1.5">
        {/* Validade */}
        {license.expirationDate && (
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-on-surface-variant shrink-0" />
            <span className="text-xs text-on-surface-variant">Válida até:</span>
            <span
              className={`text-xs font-semibold ${
                isExpired
                  ? "text-error"
                  : isExpiringSoon
                    ? "text-warning"
                    : "text-on-surface"
              }`}
            >
              {formatDate(license.expirationDate)}
              {isExpiringSoon && !isExpired && (
                <span className="ml-1 text-warning">({daysUntilExpiry}d)</span>
              )}
              {isExpired && <span className="ml-1 text-error">(expirada)</span>}
            </span>
          </div>
        )}

        {/* QR Code */}
        {license.qrCodeUrl && (
          <div className="flex items-center gap-2">
            <QrCode className="size-3.5 text-on-surface-variant shrink-0" />
            <a
              href={license.qrCodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline underline-offset-2 truncate"
            >
              Link de verificação
            </a>
          </div>
        )}

        {/* Código de verificação */}
        {license.verificationCode && (
          <div className="flex items-center gap-2">
            <Hash className="size-3.5 text-on-surface-variant shrink-0" />
            <span className="text-xs text-on-surface-variant">Código:</span>
            <span className="text-xs font-mono text-on-surface truncate">
              {license.verificationCode.slice(0, 8)}…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
