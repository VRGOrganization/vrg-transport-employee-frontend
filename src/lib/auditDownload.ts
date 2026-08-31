import type { AuditEvent } from "@/types/audit";
import { actionLabel } from "@/lib/audit";

export type AuditDownloadFormat = "json" | "csv" | "pdf";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  // Escapa aspas duplicando-as e envolve o campo — CSV RFC 4180.
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(events: AuditEvent[]): string {
  const header = [
    "id",
    "data",
    "acao",
    "acao_label",
    "resultado",
    "ator_nome",
    "ator_papel",
    "alvo_nome",
    "metadata",
  ];
  const rows = events.map((e) =>
    [
      e.id,
      fmtDate(e.createdAt),
      e.action,
      actionLabel(e.action),
      e.outcome,
      e.actorName ?? (e.actor ? "Executor não identificado" : ""),
      e.actor?.role ?? "",
      e.targetName ?? "",
      e.metadata ? JSON.stringify(e.metadata) : "",
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...rows].join("\r\n");
}

function baseName(events: AuditEvent[]): string {
  return events.length === 1
    ? `registro-auditoria-${events[0].id}`
    : `registros-auditoria-${events.length}`;
}

async function downloadPdf(events: AuditEvent[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 56;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 40) {
      doc.addPage();
      y = 56;
    }
  };

  doc.setFontSize(16);
  doc.text("Relatório de Auditoria", marginX, y);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} · ${events.length} registro(s)`,
    marginX,
    y + 8,
  );
  doc.setTextColor(30);
  y += 30;

  events.forEach((e, index) => {
    ensureSpace(120);
    doc.setDrawColor(220);
    doc.line(marginX, y, doc.internal.pageSize.getWidth() - marginX, y);
    y += 16;

    doc.setFontSize(12);
    doc.text(`${index + 1}. ${actionLabel(e.action)}`, marginX, y);
    y += 16;

    doc.setFontSize(9);
    const lines: string[] = [
      `Ação: ${e.action}`,
      `Resultado: ${e.outcome === "success" ? "Sucesso" : "Falha"}`,
      `Data: ${fmtDate(e.createdAt)}`,
      `Executado por: ${e.actorName ?? (e.actor ? "Executor não identificado" : "-")}${
        e.actor?.role ? ` (${e.actor.role})` : ""
      }`,
      `Alvo: ${e.targetName ?? "-"}`,
      `ID do registro: ${e.id}`,
    ];
    if (e.metadata && Object.keys(e.metadata).length > 0) {
      lines.push(`Detalhes: ${JSON.stringify(e.metadata)}`);
    }
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(
        line,
        doc.internal.pageSize.getWidth() - marginX * 2,
      );
      ensureSpace(wrapped.length * 12);
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 12 + 2;
    }
    y += 8;
  });

  doc.save(`${baseName(events)}.pdf`);
}

/** Baixa 1..N registros no formato escolhido pelo usuário. */
export async function downloadAuditEvents(
  events: AuditEvent[],
  format: AuditDownloadFormat,
): Promise<void> {
  if (events.length === 0) return;
  const name = baseName(events);

  if (format === "json") {
    const payload = events.length === 1 ? events[0] : events;
    triggerDownload(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
      `${name}.json`,
    );
    return;
  }

  if (format === "csv") {
    triggerDownload(
      new Blob(["﻿" + toCsv(events)], { type: "text/csv;charset=utf-8" }),
      `${name}.csv`,
    );
    return;
  }

  await downloadPdf(events);
}
