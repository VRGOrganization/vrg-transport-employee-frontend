import { DAY_LABELS } from "@/types/cards.types";
import {
  DAYS,
  PERIODS,
  type BusLoad,
  type Census,
  type CycleFunnel,
  type CycleSummary,
  type FrequencyBucket,
  type Grid,
  type GridTotals,
  type InfoLens,
  type UniversityView,
} from "@/types/info.types";
import { downloadCsv } from "@/lib/csvUtils";
import { busLabel } from "./palette";
import { exportFileName, formatDateBR, formatDateTimeBR } from "./format";

/** Tudo que uma exportação precisa — o recorte exato que está na tela. */
export interface InfoExportView {
  lens: InfoLens;
  cycle: CycleSummary | null;
  /** Rótulos legíveis dos filtros ativos, já resolvidos. */
  filterLabels: string[];
  grid: Grid;
  totals: GridTotals;
  frequency: FrequencyBucket[];
  fleet: BusLoad[];
  institutions: UniversityView;
  funnel: CycleFunnel;
  census: Census;
  cycles: CycleSummary[];
  generatedAt: string;
}

const ORIGIN_NOTE =
  "Derivado das solicitações de carteirinha do ciclo (allocationSummary).";

function cycleLabel(cycle: CycleSummary | null): string {
  if (!cycle) return "sem ciclo";
  return `${formatDateBR(cycle.cycleStartDate)} a ${formatDateBR(cycle.endDate)}`;
}

/** Cabeçalho comum aos três formatos: recorte, origem e horário. */
function headerLines(view: InfoExportView): string[][] {
  return [
    ["Relatório", "Informações do sistema de transporte"],
    ["Ciclo", cycleLabel(view.cycle)],
    [
      "Filtros",
      view.filterLabels.length > 0 ? view.filterLabels.join(" · ") : "nenhum",
    ],
    ["Gerado em", formatDateTimeBR(view.generatedAt)],
    ["Origem", ORIGIN_NOTE],
  ];
}

// ── CSV ─────────────────────────────────────────────────────────────────────

function cell(value: unknown): string {
  const text = value == null ? "" : String(value);
  // RFC 4180: aspas duplicadas, quebras de linha achatadas.
  return `"${text.replace(/"/g, '""').replace(/[\r\n]+/g, " ")}"`;
}

function row(values: unknown[]): string {
  return values.map(cell).join(",");
}

/**
 * CSV com várias seções, cada uma precedida por uma linha em branco e um
 * título. O BOM é injetado por `downloadCsv` — sem ele o Excel brasileiro
 * estraga os acentos.
 */
export function buildInfoCsv(view: InfoExportView): string {
  const lines: string[] = [];

  const section = (title: string) => {
    lines.push("");
    lines.push(row([title]));
  };

  lines.push(row(["Cabeçalho do recorte"]));
  for (const line of headerLines(view)) lines.push(row(line));

  section("Censo");
  lines.push(row(["Categoria", "Quantidade"]));
  lines.push(row(["Estudantes ativos", view.census.studentsActive]));
  lines.push(row(["Estudantes inativos", view.census.studentsInactive]));
  lines.push(row(["Estudantes com status ativo", view.census.studentsActiveStatus]));
  lines.push(row(["Estudantes pendentes", view.census.studentsPending]));
  lines.push(row(["Estudantes expirados", view.census.studentsExpired]));
  lines.push(row(["Funcionários ativos", view.census.employeesActive]));
  lines.push(row(["Funcionários inativos", view.census.employeesInactive]));

  section("Grade dia x turno");
  lines.push(row(["Turno", ...DAYS.map((d) => DAY_LABELS[d]), "Total"]));
  for (const period of PERIODS) {
    lines.push(
      row([
        period,
        ...DAYS.map((day) => view.grid[day][period].value),
        view.totals.byPeriod[period],
      ]),
    );
  }
  lines.push(
    row([
      "Total",
      ...DAYS.map((day) => view.totals.byDay[day]),
      view.totals.total,
    ]),
  );

  section("Frequência semanal");
  lines.push(row(["Dias por semana", "Alunos"]));
  for (const bucket of view.frequency) {
    lines.push(row([bucket.days, bucket.students]));
  }

  section("Frota por dia");
  lines.push(
    row([
      "Ônibus",
      "Turno",
      "Capacidade",
      ...DAYS.map((d) => DAY_LABELS[d]),
      "Pico",
      "Alunos",
    ]),
  );
  for (const load of view.fleet) {
    lines.push(
      row([
        busLabel(load.busIdentifier),
        load.shift ?? "",
        load.capacity ?? "sem limite",
        ...load.days.map((d) => d.value),
        load.peak,
        load.students,
      ]),
    );
  }

  section("Faculdades");
  lines.push(row(["Sigla", "Faculdade", "Temporária", "Alunos", ...PERIODS]));
  for (const institution of view.institutions.rows) {
    lines.push(
      row([
        institution.acronym,
        institution.name,
        institution.temporary ? "Sim" : "Não",
        institution.students,
        ...institution.byShift.map((s) => s.students),
      ]),
    );
  }
  lines.push(
    row([
      "",
      "Alunos com dupla matrícula (contados em duas faculdades)",
      "",
      view.institutions.alunosComDuplaMatricula,
    ]),
  );

  section("Cursos");
  lines.push(
    row(["Faculdade", "Curso", "Modalidade", "Alunos", ...DAYS.map((d) => DAY_LABELS[d])]),
  );
  for (const institution of view.institutions.rows) {
    for (const course of institution.courses) {
      lines.push(
        row([
          institution.acronym,
          course.label,
          course.model ?? "",
          course.students,
          ...course.weekly,
        ]),
      );
    }
  }

  section("Histórico de ciclos");
  lines.push(row(["Início do ciclo", "Fim da janela", "Estado", "Carteirinhas"]));
  for (const cycle of view.cycles) {
    lines.push(
      row([
        formatDateBR(cycle.cycleStartDate),
        formatDateBR(cycle.endDate),
        cycle.status,
        cycle.licenses,
      ]),
    );
  }

  return lines.join("\n");
}

// ── JSON ────────────────────────────────────────────────────────────────────

/** Snapshot reduzido — formato para quem vai reprocessar. */
export function buildInfoJson(view: InfoExportView): string {
  return JSON.stringify(
    {
      generatedAt: view.generatedAt,
      origin: ORIGIN_NOTE,
      lens: {
        ...view.lens,
        cycleLabel: cycleLabel(view.cycle),
        filterLabels: view.filterLabels,
      },
      census: view.census,
      funnel: view.funnel,
      grid: DAYS.reduce<Record<string, Record<string, number>>>((acc, day) => {
        acc[day] = PERIODS.reduce<Record<string, number>>((inner, period) => {
          inner[period] = view.grid[day][period].value;
          return inner;
        }, {});
        return acc;
      }, {}),
      totals: {
        byDay: view.totals.byDay,
        byPeriod: view.totals.byPeriod,
        total: view.totals.total,
      },
      frequency: view.frequency,
      fleet: view.fleet.map((load) => ({
        busIdentifier: load.busIdentifier,
        shift: load.shift,
        capacity: load.capacity,
        peak: load.peak,
        students: load.students,
        days: load.days.map((d) => ({ day: d.day, value: d.value })),
      })),
      institutions: {
        alunosComDuplaMatricula: view.institutions.alunosComDuplaMatricula,
        rows: view.institutions.rows.map((institution) => ({
          acronym: institution.acronym,
          name: institution.name,
          temporary: institution.temporary,
          students: institution.students,
          byShift: institution.byShift,
          weekly: institution.weekly,
          courses: institution.courses.map((course) => ({
            label: course.label,
            model: course.model,
            students: course.students,
            weekly: course.weekly,
          })),
        })),
      },
      cycles: view.cycles,
    },
    null,
    2,
  );
}

// ── PDF ─────────────────────────────────────────────────────────────────────

/** Documento oficial: sem imagem, sem cor de fundo. */
export async function buildInfoPdf(
  view: InfoExportView,
  readoutText: string,
): Promise<Blob> {
  // Import dinâmico: jspdf é pesado e só é necessário ao exportar.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginX * 2;
  let y = 56;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 40) {
      doc.addPage();
      y = 56;
    }
  };

  const heading = (text: string) => {
    ensureSpace(28);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(text, marginX, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  };

  const table = (header: string[], rows: (string | number)[][]) => {
    const columnWidth = usableWidth / header.length;
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    header.forEach((label, i) => {
      doc.text(String(label), marginX + i * columnWidth, y, {
        maxWidth: columnWidth - 4,
      });
    });
    y += 12;
    doc.setFont("helvetica", "normal");
    for (const line of rows) {
      ensureSpace(14);
      line.forEach((value, i) => {
        doc.text(String(value ?? ""), marginX + i * columnWidth, y, {
          maxWidth: columnWidth - 4,
        });
      });
      y += 12;
    }
    y += 8;
  };

  // ── Capa ────────────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Informações do transporte universitário", marginX, y);
  y += 24;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const [label, value] of headerLines(view)) {
    ensureSpace(14);
    doc.text(`${label}: ${value}`, marginX, y, { maxWidth: usableWidth });
    y += 13;
  }
  y += 10;

  if (readoutText) {
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(readoutText, usableWidth) as string[];
    ensureSpace(wrapped.length * 13 + 10);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 13 + 14;
    doc.setFontSize(9);
  }

  // ── Tabelas ─────────────────────────────────────────────────────────────
  heading("Grade dia x turno");
  const gridRows: (string | number)[][] = PERIODS.map((period) => [
    period,
    ...DAYS.map((day) => view.grid[day][period].value),
    view.totals.byPeriod[period],
  ]);
  gridRows.push([
    "Total",
    ...DAYS.map((day) => view.totals.byDay[day]),
    view.totals.total,
  ]);
  table(["Turno", ...DAYS.map((d) => DAY_LABELS[d]), "Total"], gridRows);

  heading("Frota por dia");
  table(
    ["Ônibus", ...DAYS.map((d) => DAY_LABELS[d].slice(0, 3)), "Pico"],
    view.fleet.map((load) => [
      busLabel(load.busIdentifier),
      ...load.days.map((d) => d.value),
      load.peak,
    ]),
  );

  heading("Faculdades");
  table(
    ["Sigla", "Faculdade", "Alunos"],
    view.institutions.rows.map((institution) => [
      institution.acronym,
      institution.name,
      institution.students,
    ]),
  );

  heading("Histórico de ciclos");
  table(
    ["Início", "Fim da janela", "Estado", "Carteirinhas"],
    view.cycles.map((cycle) => [
      formatDateBR(cycle.cycleStartDate),
      formatDateBR(cycle.endDate),
      cycle.status,
      cycle.licenses,
    ]),
  );

  return doc.output("blob");
}

// ── Disparo ─────────────────────────────────────────────────────────────────

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

/** Exporta o recorte atual no formato escolhido. */
export async function downloadInfo(
  format: "csv" | "json" | "pdf",
  view: InfoExportView,
  readoutText: string,
): Promise<void> {
  const label = view.cycle ? formatDateBR(view.cycle.cycleStartDate) : null;

  if (format === "csv") {
    downloadCsv(buildInfoCsv(view), exportFileName("csv", label));
    return;
  }

  if (format === "json") {
    triggerDownload(
      new Blob([buildInfoJson(view)], { type: "application/json" }),
      exportFileName("json", label),
    );
    return;
  }

  triggerDownload(await buildInfoPdf(view, readoutText), exportFileName("pdf", label));
}
