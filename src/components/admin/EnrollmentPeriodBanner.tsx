"use client";

import { AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

interface EnrollmentPeriodBannerProps {
  endDate: string;
}

function getDaysUntilEnd(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function EnrollmentPeriodBanner({ endDate }: EnrollmentPeriodBannerProps) {
  const days = getDaysUntilEnd(endDate);

  // Não exibir se ainda faltam mais de 15 dias
  if (days > 15) return null;

  // Já expirou
  if (days <= 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-error/40 bg-error/10 px-4 py-3">
        <AlertTriangle className="size-4 text-error shrink-0" />
        <p className="text-sm text-error flex-1">
          O período de inscrição <strong>expirou</strong>. O sistema encerrará automaticamente
          na próxima verificação.
        </p>
        <Link
          href="/admin/enrollment-period"
          className="cursor-pointer text-xs font-semibold text-error underline underline-offset-2 shrink-0 hover:opacity-70 transition-opacity"
        >
          Ver período
        </Link>
      </div>
    );
  }

  const isUrgent = days <= 1;
  const isWarning = days <= 7;

  const styles = isUrgent
    ? { container: "border-error/40 bg-error/10", text: "text-error", icon: "text-error" }
    : isWarning
      ? { container: "border-warning/40 bg-warning/10", text: "text-warning", icon: "text-warning" }
      : { container: "border-primary/30 bg-primary/5", text: "text-primary", icon: "text-primary" };

  const message = isUrgent
    ? "O período de inscrição encerra HOJE. Após o encerramento, novas solicitações serão bloqueadas."
    : `O período de inscrição encerra em ${days} dia${days > 1 ? "s" : ""}. Gerencie as solicitações pendentes antes do prazo.`;

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${styles.container}`}>
      <Clock className={`size-4 shrink-0 ${styles.icon}`} />
      <p className={`text-sm flex-1 ${styles.text}`}>{message}</p>
      <Link
        href="/admin/enrollment-period"
        className={`cursor-pointer text-xs font-semibold underline underline-offset-2 shrink-0 hover:opacity-70 transition-opacity ${styles.text}`}
      >
        Ver período
      </Link>
    </div>
  );
}
