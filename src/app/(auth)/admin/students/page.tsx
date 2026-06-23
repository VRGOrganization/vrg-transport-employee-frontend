"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, UserX, UserCheck, CheckCircle2, ShieldBan, ShieldCheck, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
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
import { toTitleCase } from "@/lib/utils/string";
import { buildStudentsCsv, downloadCsv } from "@/lib/csvUtils";
import { StudentCreateModal } from "@/components/students/StudentCreateModal";
import { StudentDocumentsModal } from "@/components/students/StudentDocumentsModal";
import { StudentInfoModal } from "./info/StudentInfoModal";
import { StudentCardModal } from "./StudentCardModal";
import { UnbanModal } from "@/components/admin/UnbanModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/lib/toast";
import type { PageSize } from "@/lib/constants";

type StudentTab = "active" | "inactive";
type Tab = StudentTab | "banned";

const TAB_ITEMS = [
  { key: "active" as Tab,   label: "Ativos",      icon: "check_circle" },
  { key: "inactive" as Tab, label: "Desativados",  icon: "person_off"  },
  { key: "banned" as Tab,   label: "Banidos",      icon: "block"       },
];

const STUDENT_COLUMNS: Column<Student>[] = [
  {
    key: "name",
    label: "Estudante",
    render: (s) => (
      <div className="flex items-center gap-3">
        <Avatar name={s.name} size="sm" />
        <span className="text-sm font-medium text-on-surface">{toTitleCase(s.name)}</span>
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
          {e.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface">{toTitleCase(e.name)}</p>
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

export default function StudentsPage() {
  const [topTab, setTopTab]                   = useState<Tab>("active");
  const [createOpen, setCreateOpen]           = useState(false);
  const [viewingStudent, setViewingStudent]   = useState<Student | null>(null);
  const [docsStudent, setDocsStudent]         = useState<Student | null>(null);
  const [toggleTarget, setToggleTarget]       = useState<Student | null>(null);
  const [toggleLoading, setToggleLoading]     = useState(false);
  const [toggleError, setToggleError]         = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("view");
    if (!id) return;
    studentService.getById(id).then(setViewingStudent).catch(() => {});
  }, []);
  const [viewingCardStudent, setViewingCard]  = useState<Student | null>(null);
  const [unbanTarget, setUnbanTarget]         = useState<BanlistEntry | null>(null);
  const [openDropdownId, setOpenDropdownId]   = useState<string | null>(null);
  const [bannedIds, setBannedIds]             = useState<Set<string>>(new Set());

  // ── Student tabs (active / inactive) ─────────────────────────────
  const studentFetcher = useCallback(
    async (t: StudentTab) => {
      const [students, activeBans] = await Promise.all([
        t === "active" ? studentService.list() : studentService.listInactive(),
        banlistService.list(true).catch(() => [] as BanlistEntry[]),
      ]);
      const ids = new Set(activeBans.map((b) => b.studentId));
      setBannedIds(ids);
      return students.filter((s) => !ids.has(s._id));
    },
    [],
  );

  const [sortAsc, setSortAsc] = useState(true);

  const sortFn = useCallback(
    (a: Student, b: Student) =>
      sortAsc
        ? a.name.localeCompare(b.name, "pt-BR")
        : b.name.localeCompare(a.name, "pt-BR"),
    [sortAsc],
  );

  const {
    tab: studentTab, setTab: setStudentTab,
    search: studentSearch, setSearch: setStudentSearch,
    page: studentPage, setPage: setStudentPage,
    pageSize: studentPageSize, setPageSize: setStudentPageSize,
    loading: studentLoading, error: studentError,
    filtered: studentFiltered,
    paginated: studentPaginated, total: studentTotal, reloadAll: studentReloadAll,
  } = useListPage<Student, StudentTab>({
    tabs: ["active", "inactive"],
    initialTab: "active",
    fetcher: studentFetcher,
    searchFields: (s) => [s.name, s.email, s.institution ?? ""],
    sortFn,
  });

  // ── Banned tab ────────────────────────────────────────────────────
  const banFetcher = useCallback(() => banlistService.list(true), []);

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
    searchFields: (e) => [e.name, e.email],
    errorMessage: "Não foi possível carregar os banimentos.",
  });

  // ── Tab switching ─────────────────────────────────────────────────
  const handleTabChange = (t: Tab) => {
    setTopTab(t);
    if (t !== "banned") setStudentTab(t as StudentTab);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true);
    setToggleError("");
    try {
      if (toggleTarget.active) {
        await studentService.deactivate(toggleTarget._id);
        toast.success(`${toggleTarget.name} foi desativado com sucesso.`);
      } else {
        await studentService.reactivate(toggleTarget._id);
        toast.success(`${toggleTarget.name} foi reativado com sucesso.`);
      }
      setToggleTarget(null);
      studentReloadAll();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setToggleError(e.message ?? "Erro ao alterar status do estudante");
    } finally {
      setToggleLoading(false);
    }
  };

  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const label = studentTab === "active" ? "ativos" : "desativados";
      downloadCsv(buildStudentsCsv(studentFiltered as Parameters<typeof buildStudentsCsv>[0]), `alunos_${label}_${today}.csv`);
      toast.success(`${studentTotal} ${studentTotal === 1 ? "aluno exportado" : "alunos exportados"} com sucesso.`);
    } catch {
      toast.error("Erro ao exportar. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleBanned = () => {
    const name = viewingStudent?.name;
    setViewingStudent(null);
    banReload();
    studentReloadAll();
    if (name) toast.success(`${name} foi banido do sistema.`);
  };

  // ── Status toggle column ──────────────────────────────────────────
  const statusColumn: Column<Student> = {
    key: "status",
    label: "Status",
    render: (student) => (
      <button
        onClick={(e) => { e.stopPropagation(); setToggleTarget(student); }}
        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
          student.active
            ? "bg-success-container text-on-success border-success/30 hover:bg-success/20 hover:border-success/50"
            : "bg-surface-container-high text-on-surface-variant border-outline-variant/50 hover:bg-surface-container-highest hover:border-outline-variant"
        }`}
      >
        {student.active ? "Ativo" : "Inativo"}
      </button>
    ),
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

  // STUDENT_COLUMNS: [name, email, institution, shift, createdAt] (status removed — now interactive)
  const studentColumns = [
    STUDENT_COLUMNS[0], // name
    STUDENT_COLUMNS[1], // email
    STUDENT_COLUMNS[2], // institution
    STUDENT_COLUMNS[3], // shift
    statusColumn,
    STUDENT_COLUMNS[4], // createdAt
    actionsColumn,
  ];
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
                {studentTotal} {studentTotal === 1 ? "estudante" : "estudantes"}{" "}
                {studentTab === "active" ? "ativos" : "desativados"}
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
          <Tabs items={TAB_ITEMS} value={topTab} onChange={handleTabChange} />
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
                icon={studentTab === "active" ? GraduationCap : UserX}
                title={studentTab === "active" ? "Nenhum estudante ativo" : "Nenhum estudante desativado"}
                description={
                  studentSearch
                    ? "Nenhum estudante encontrado para esta busca."
                    : studentTab === "active"
                    ? "Adicione o primeiro estudante ao sistema."
                    : "Estudantes desativados aparecerão aqui."
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
            onExport={handleExport}
            exportLoading={exportLoading}
            exportLabel={studentTab === "active" ? "Exportar Ativos" : "Exportar Desativados"}
            className="mx-4 mb-4"
          />
        )}

        {/* Table — banned */}
        {isBanned && (
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
          onBanned={handleBanned}
        />
      )}
      {docsStudent && (
        <StudentDocumentsModal
          studentId={docsStudent._id}
          studentName={docsStudent.name}
          onClose={() => setDocsStudent(null)}
        />
      )}
      {toggleTarget && (
        <ConfirmModal
          open
          onClose={() => { setToggleError(""); setToggleTarget(null); }}
          onConfirm={handleConfirmToggle}
          loading={toggleLoading}
          error={toggleError}
          title={toggleTarget.active ? "Desativar estudante?" : "Reativar estudante?"}
          icon={toggleTarget.active ? UserX : CheckCircle2}
          variant={toggleTarget.active ? "danger" : "success"}
          description={
            toggleTarget.active
              ? <><strong>{toggleTarget.name}</strong> perderá acesso ao sistema imediatamente. O cadastro poderá ser reativado posteriormente.</>
              : <><strong>{toggleTarget.name}</strong> recuperará acesso ao sistema imediatamente.</>
          }
          confirmLabel={toggleTarget.active ? "Sim, desativar" : "Sim, reativar"}
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
            const name = unbanTarget?.name;
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
