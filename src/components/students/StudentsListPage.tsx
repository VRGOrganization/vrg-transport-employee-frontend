"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, ShieldBan, ShieldCheck, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { studentService } from "@/services/studentService";
import { banlistService } from "@/services/banlistService";
import type { Student } from "@/types/student";
import type { BanlistEntry } from "@/types/banlist";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { useListPage } from "@/hooks/ui/useListPage";
import { getShiftLabel } from "@/lib/constants";
import { resolveDisplayName, toTitleCase } from "@/lib/utils/string";
import { buildStudentsCsv, downloadCsv } from "@/lib/csvUtils";
import { StudentCreateModal } from "@/components/students/StudentCreateModal";
import { StudentDocumentsModal } from "@/components/students/StudentDocumentsModal";
import { StudentInfoModal } from "./StudentInfoModal";
import { StudentCardModal } from "./StudentCardModal";
import { UnbanModal } from "@/components/admin/UnbanModal";
import { toast } from "@/lib/toast";
import type { PageSize } from "@/lib/constants";

type Tab = "active" | "banned";

const TAB_ITEMS = [
  { key: "active" as Tab, label: "Ativos",  icon: "check_circle" },
  { key: "banned" as Tab, label: "Banidos", icon: "block"        },
];

// Funcionário não gerencia banimentos.
const STUDENT_ONLY_TAB_ITEMS = TAB_ITEMS.filter((t) => t.key !== "banned");

const STUDENT_COLUMNS: Column<Student>[] = [
  {
    key: "name",
    label: "Estudante",
    render: (s) => (
      <div className="flex items-center gap-3">
        <Avatar name={resolveDisplayName(s)} size="sm" />
        <span className="text-sm font-medium text-on-surface">{toTitleCase(resolveDisplayName(s))}</span>
      </div>
    ),
    skeleton: () => (
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-surface-container-high animate-pulse shrink-0" />
        <div className="h-3 w-32 bg-surface-container-high rounded animate-pulse" />
      </div>
    ),
  },
  {
    key: "email",
    label: "E-mail",
    render: (s) => <span className="text-sm text-on-surface-variant">{s.email}</span>,
  },
  {
    key: "institution",
    label: "Instituição",
    render: (s) => <span className="text-sm text-on-surface-variant">{s.institution ?? "—"}</span>,
  },
  {
    key: "shift",
    label: "Turno",
    render: (s) => <span className="text-sm text-on-surface-variant">{getShiftLabel(s.shift)}</span>,
  },
  {
    key: "createdAt",
    label: "Cadastro",
    align: "right",
    render: (s) => (
      <span className="text-xs text-on-surface-variant">
        {new Date(s.createdAt).toLocaleDateString("pt-BR")}
      </span>
    ),
  },
];

const BAN_COLUMNS: Column<BanlistEntry>[] = [
  {
    key: "name",
    label: "Estudante",
    render: (e) => (
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-error/10 flex items-center justify-center text-error font-bold text-xs shrink-0">
          {resolveDisplayName(e).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface">{toTitleCase(resolveDisplayName(e))}</p>
          {e.socialName?.trim() && (
            <p className="text-xs text-on-surface-variant">Nome de registro: {toTitleCase(e.name)}</p>
          )}
          <p className="text-xs text-on-surface-variant">{e.email}</p>
        </div>
      </div>
    ),
    skeleton: () => (
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-surface-container-high animate-pulse shrink-0" />
        <div className="h-3 w-36 bg-surface-container-high rounded animate-pulse" />
      </div>
    ),
  },
  {
    key: "reasons",
    label: "Motivos",
    render: (e) => (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {e.reasons.slice(0, 2).map((r, i) => (
          <span
            key={i}
            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-error/8 text-error border border-error/20 truncate max-w-40"
            title={r}
          >
            {r}
          </span>
        ))}
        {e.reasons.length > 2 && (
          <span className="text-[10px] text-on-surface-variant">+{e.reasons.length - 2} mais</span>
        )}
      </div>
    ),
  },
  {
    key: "createdAt",
    label: "Banido em",
    render: (e) => (
      <span className="text-sm text-on-surface-variant">
        {new Date(e.createdAt).toLocaleDateString("pt-BR")}
      </span>
    ),
  },
];

export function StudentsListPage({ role }: { role: "admin" | "employee" }) {
  const isAdmin = role === "admin";
  const [topTab, setTopTab]                   = useState<Tab>("active");
  const [createOpen, setCreateOpen]           = useState(false);
  const [viewingStudent, setViewingStudent]   = useState<Student | null>(null);
  const [docsStudent, setDocsStudent]         = useState<Student | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("view");
    if (!id) return;
    studentService.getById(id).then(setViewingStudent).catch(() => {});
  }, []);
  const [viewingCardStudent, setViewingCard]  = useState<Student | null>(null);
  const [unbanTarget, setUnbanTarget]         = useState<BanlistEntry | null>(null);
  const [openDropdownId, setOpenDropdownId]   = useState<string | null>(null);

  // ── Lista de estudantes ativos ───────────────────────────────────
  const studentFetcher = useCallback(async () => {
    // Funcionário não acessa a banlist (endpoint admin-only).
    if (!isAdmin) return studentService.list();
    const [students, activeBans] = await Promise.all([
      studentService.list(),
      banlistService.list(true).catch(() => [] as BanlistEntry[]),
    ]);
    const ids = new Set(activeBans.map((b) => b.studentId));
    return students.filter((s) => !ids.has(s._id));
  }, [isAdmin]);

  const [sortAsc, setSortAsc] = useState(true);

  const sortFn = useCallback(
    (a: Student, b: Student) =>
      sortAsc
        ? resolveDisplayName(a).localeCompare(resolveDisplayName(b), "pt-BR")
        : resolveDisplayName(b).localeCompare(resolveDisplayName(a), "pt-BR"),
    [sortAsc],
  );

  const {
    search: studentSearch, setSearch: setStudentSearch,
    page: studentPage, setPage: setStudentPage,
    pageSize: studentPageSize, setPageSize: setStudentPageSize,
    loading: studentLoading, error: studentError,
    filtered: studentFiltered,
    paginated: studentPaginated, total: studentTotal, reloadAll: studentReloadAll,
  } = useListPage<Student, "active">({
    tabs: ["active"],
    initialTab: "active",
    fetcher: studentFetcher,
    searchFields: (s) => [s.name, s.socialName ?? "", s.email, s.institution ?? ""],
    sortFn,
  });

  // ── Banidos (admin) ──────────────────────────────────────────────
  const banFetcher = useCallback(
    () => (isAdmin ? banlistService.list(true) : Promise.resolve([] as BanlistEntry[])),
    [isAdmin],
  );

  const {
    search: banSearch, setSearch: setBanSearch,
    page: banPage, setPage: setBanPage,
    pageSize: banPageSize, setPageSize: setBanPageSize,
    loading: banLoading, error: banError,
    paginated: banPaginated, total: banTotal, reload: banReload,
  } = useListPage<BanlistEntry, "banned">({
    tabs: ["banned"],
    initialTab: "banned",
    fetcher: banFetcher,
    searchFields: (e) => [e.name, e.socialName ?? "", e.email],
    errorMessage: "Não foi possível carregar os banimentos.",
  });

  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      downloadCsv(buildStudentsCsv(studentFiltered as Parameters<typeof buildStudentsCsv>[0]), `alunos_${today}.csv`);
      toast.success(`${studentTotal} ${studentTotal === 1 ? "aluno exportado" : "alunos exportados"} com sucesso.`);
    } catch {
      toast.error("Erro ao exportar. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleBanned = () => {
    const name = viewingStudent && resolveDisplayName(viewingStudent);
    setViewingStudent(null);
    banReload();
    studentReloadAll();
    if (name) toast.success(`${name} foi banido do sistema.`);
  };

  // ── Student action column ─────────────────────────────────────────
  const actionsColumn: Column<Student> = {
    key: "actions",
    label: "Ação",
    align: "right",
    render: (student) => (
      <div className="relative inline-block text-left">
        <button
          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === student._id ? null : student._id); }}
          className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors ml-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>
        {openDropdownId === student._id && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
            <div className="absolute right-0 mt-2 w-36 bg-surface-container-lowest rounded-lg shadow-xl border border-outline-variant/30 z-20 py-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {[
                { icon: "visibility",  label: "Ver",         action: () => { setViewingStudent(student); setOpenDropdownId(null); } },
                { icon: "folder_open", label: "Documentos",  action: () => { setDocsStudent(student);    setOpenDropdownId(null); } },
                { icon: "badge",       label: "Carteirinha", action: () => { setViewingCard(student);    setOpenDropdownId(null); } },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={(e) => { e.stopPropagation(); action(); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    ),
  };

  // ── Ban action column ─────────────────────────────────────────────
  const banActionsColumn: Column<BanlistEntry> = {
    key: "actions",
    label: "Ação",
    align: "right",
    render: (entry) => (
      <button
        onClick={() => setUnbanTarget(entry)}
        title="Remover banimento"
        className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-success hover:bg-success/10 transition-colors ml-auto cursor-pointer"
      >
        <ShieldCheck className="size-4" />
      </button>
    ),
  };

  const studentColumns = [...STUDENT_COLUMNS, actionsColumn];
  const banColumns = [...BAN_COLUMNS, banActionsColumn];

  const isBanned = topTab === "banned";
  const isStudentTab = !isBanned;

  return (
    <>
      <main className="flex flex-col flex-1 bg-surface overflow-hidden">
        {/* Page header */}
        <div className="flex items-center justify-between px-4 pt-6 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Estudantes</h1>
            {isStudentTab && !studentLoading && !studentError && (
              <p className="text-sm text-on-surface-variant mt-1">
                {studentTotal} {studentTotal === 1 ? "estudante" : "estudantes"}
              </p>
            )}
            {isBanned && !banLoading && !banError && (
              <p className="text-sm text-on-surface-variant mt-1">
                {banTotal} {banTotal === 1 ? "aluno banido" : "alunos banidos"}
              </p>
            )}
          </div>
          {isStudentTab && (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              Adicionar estudante
            </Button>
          )}
        </div>

        {/* Toolbar */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <Tabs items={isAdmin ? TAB_ITEMS : STUDENT_ONLY_TAB_ITEMS} value={topTab} onChange={setTopTab} />
          {isStudentTab && (
            <button
              onClick={() => setSortAsc((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-on-surface-variant border border-outline-variant/50 bg-surface-container hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              {sortAsc ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}
              {sortAsc ? "A–Z" : "Z–A"}
            </button>
          )}
        </div>

        {/* Table — students */}
        {isStudentTab && (
          <DataTable
            columns={studentColumns}
            rows={studentPaginated}
            rowKey={(s) => s._id}
            onRowClick={(s) => setViewingStudent(s)}
            loading={studentLoading}
            error={studentError ? <ErrorState message={studentError} onRetry={studentReloadAll} /> : undefined}
            empty={
              <EmptyState
                icon={GraduationCap}
                title="Nenhum estudante"
                description={
                  studentSearch
                    ? "Nenhum estudante encontrado para esta busca."
                    : "Adicione o primeiro estudante ao sistema."
                }
              />
            }
            page={studentPage}
            pageSize={studentPageSize}
            total={studentTotal}
            onPageChange={setStudentPage}
            onPageSizeChange={(s) => setStudentPageSize(s as PageSize)}
            search={{
              value: studentSearch,
              onChange: setStudentSearch,
              placeholder: "Buscar por nome, e-mail ou instituição…",
            }}
            onExport={isAdmin ? handleExport : undefined}
            exportLoading={exportLoading}
            exportLabel="Exportar"
            className="mx-4 mb-4"
          />
        )}

        {/* Table — banned (admin only) */}
        {isAdmin && isBanned && (
          <DataTable
            columns={banColumns}
            rows={banPaginated}
            rowKey={(e) => e._id}
            loading={banLoading}
            error={banError ? <ErrorState message={banError} onRetry={banReload} /> : undefined}
            empty={
              <EmptyState
                icon={ShieldBan}
                title="Nenhum aluno banido"
                description={
                  banSearch
                    ? "Nenhum registro encontrado para esta busca."
                    : "Nenhum aluno está banido no momento."
                }
              />
            }
            page={banPage}
            pageSize={banPageSize}
            total={banTotal}
            onPageChange={setBanPage}
            onPageSizeChange={(s) => setBanPageSize(s as PageSize)}
            search={{
              value: banSearch,
              onChange: setBanSearch,
              placeholder: "Buscar por nome ou e-mail…",
            }}
            className="mx-4 mb-4"
          />
        )}
      </main>

      {createOpen && (
        <StudentCreateModal
          open
          onClose={() => setCreateOpen(false)}
          onCreated={studentReloadAll}
        />
      )}
      {viewingStudent && (
        <StudentInfoModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onBanned={isAdmin ? handleBanned : undefined}
          canBan={isAdmin}
        />
      )}
      {docsStudent && (
        <StudentDocumentsModal
          studentId={docsStudent._id}
          studentName={docsStudent.name}
          studentSocialName={docsStudent.socialName}
          hasDisability={docsStudent.hasDisability ?? false}
          onClose={() => setDocsStudent(null)}
        />
      )}
      {viewingCardStudent && (
        <StudentCardModal student={viewingCardStudent} onClose={() => setViewingCard(null)} />
      )}
      {unbanTarget && (
        <UnbanModal
          open
          entry={unbanTarget}
          onClose={() => setUnbanTarget(null)}
          onSuccess={() => {
            const name = unbanTarget && resolveDisplayName(unbanTarget);
            setUnbanTarget(null);
            banReload();
            studentReloadAll();
            if (name) toast.success(`Banimento de ${name} removido com sucesso.`);
          }}
        />
      )}
    </>
  );
}
