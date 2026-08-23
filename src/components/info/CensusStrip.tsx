"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Census } from "@/types/info.types";
import { formatNumber } from "@/lib/info/format";

interface CensusStripProps {
  census: Census;
}

/**
 * As pessoas do sistema. Sem cartões: uma faixa de linhas separadas por
 * hairlines, com os números alinhados à direita em `tabular-nums`.
 *
 * Cada linha leva à página correspondente — a página de informações é um
 * trampolim, não um beco.
 */
export function CensusStrip({ census }: CensusStripProps) {
  const statusTotal =
    census.studentsPending + census.studentsActiveStatus + census.studentsExpired;

  return (
    <section
      aria-labelledby="info-pessoas"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
    >
      <h2 id="info-pessoas" className="mb-2 text-sm font-semibold text-on-surface">
        Pessoas
      </h2>

      <Link
        href="/admin/students"
        className="group flex items-baseline justify-between gap-2 rounded py-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="text-sm text-on-surface-variant transition-colors duration-150 group-hover:text-on-surface">
          Estudantes
        </span>
        <span className="flex items-baseline gap-3">
          <span className="text-sm tabular-nums text-on-surface">
            {formatNumber(census.studentsActive)} ativos
          </span>
          <span className="text-xs tabular-nums text-on-surface-muted">
            {formatNumber(census.studentsInactive)} inativos
          </span>
        </span>
      </Link>

      {/* Micro-barra de proporção pendente/ativo/expirado. */}
      {statusTotal > 0 && (
        <div
          className="mb-1 flex h-[3px] w-full overflow-hidden rounded-full bg-surface-container-low"
          title={`Pendentes ${formatNumber(census.studentsPending)} · Ativos ${formatNumber(census.studentsActiveStatus)} · Expirados ${formatNumber(census.studentsExpired)}`}
        >
          <span
            className="info-bar block h-full bg-warning"
            style={{ width: `${(census.studentsPending / statusTotal) * 100}%` }}
          />
          <span
            className="info-bar block h-full bg-success"
            style={{
              width: `${(census.studentsActiveStatus / statusTotal) * 100}%`,
            }}
          />
          <span
            className="info-bar block h-full bg-error"
            style={{ width: `${(census.studentsExpired / statusTotal) * 100}%` }}
          />
        </div>
      )}

      <ul className="mb-1 border-b border-outline-variant pb-1.5">
        <SubRow label="ativos" value={census.studentsActiveStatus} tone="success" />
        <SubRow label="pendentes" value={census.studentsPending} tone="warning" />
        <SubRow label="expirados" value={census.studentsExpired} tone="error" />
      </ul>

      <Link
        href="/admin/employees"
        className="group flex items-baseline justify-between gap-2 rounded py-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="text-sm text-on-surface-variant transition-colors duration-150 group-hover:text-on-surface">
          Funcionários
        </span>
        <span className="flex items-baseline gap-3">
          <span className="text-sm tabular-nums text-on-surface">
            {formatNumber(census.employeesActive)} ativos
          </span>
          <span className="text-xs tabular-nums text-on-surface-muted">
            {formatNumber(census.employeesInactive)} inativos
          </span>
        </span>
      </Link>

      <p className="mt-2 text-[11px] leading-snug text-on-surface-muted">
        &quot;Ativos/inativos&quot; é o cadastro ligado ou desligado. A quebra
        indentada é o estado de verificação do aluno.
      </p>
    </section>
  );
}

const TONE_CLASS = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
} as const;

function SubRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONE_CLASS;
}) {
  return (
    <li className="flex items-baseline justify-between gap-2 pl-3">
      <span className="flex items-center gap-1.5 text-[13px] text-on-surface-variant">
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", TONE_CLASS[tone])}
        />
        {label}
      </span>
      <span className="text-[13px] tabular-nums text-on-surface">
        {formatNumber(value)}
      </span>
    </li>
  );
}
