"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { GraduationCap, UserX } from "lucide-react";
import { studentService } from "@/services/studentService";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/SearchInput";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { useListPage } from "@/hooks/ui/useListPage";
import { getShiftLabel } from "@/lib/constants";
import { StudentModal } from "@/components/students/StudentModal";
import { StudentInfoModal } from "./info/StudentInfoModal";
import { StudentCardModal } from "./StudentCardModal";
import type { PageSize } from "@/lib/constants";

type Tab = "active" | "inactive";

const TAB_ITEMS = [
  { key: "active" as Tab,   label: "Ativos",      icon: "check_circle" },
  { key: "inactive" as Tab, label: "Desativados",  icon: "person_off"  },
];

const COLUMNS: Column<Student>[] = [
  {
    key: "name",
    label: "Estudante",
    render: (s) => (
      <div className="flex items-center gap-3">
        <Avatar name={s.name} size="sm" />
        <span className="text-sm font-medium text-on-surface">{s.name}</span>
      </div>
    ),
    skeleton: () => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
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
    key: "status",
    label: "Status",
    render: (s) => (
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          s.active
            ? "bg-success-container text-on-success"
            : "bg-surface-container-high text-on-surface-variant"
        }`}
      >
        {s.active ? "Ativo" : "Inativo"}
      </span>
    ),
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

export default function StudentsPage() {
  const [selected, setSelected]               = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent]   = useState<Student | null>(null);
  const [viewingCardStudent, setViewingCard]  = useState<Student | null>(null);
  const [openDropdownId, setOpenDropdownId]   = useState<string | null>(null);

  const fetcher = useCallback(
    (t: Tab) => (t === "active" ? studentService.list() : studentService.listInactive()),
    [],
  );

  const { tab, setTab, search, setSearch, page, setPage, pageSize, setPageSize,
    loading, error, paginated, total, reload } =
    useListPage<Student, Tab>({
      tabs: ["active", "inactive"],
      initialTab: "active",
      fetcher,
      searchFields: (s) => [s.name, s.email, s.institution ?? ""],
    });

  const handleReload = () => { setSelected(null); reload(); };

  const actionsColumn: Column<Student> = {
    key: "actions",
    label: "Ação",
    align: "right",
    render: (student) => (
      <div className="relative inline-block text-left">
        <button
          onClick={() => setOpenDropdownId(openDropdownId === student._id ? null : student._id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors ml-auto"
        >
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>
        {openDropdownId === student._id && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
            <div className="absolute right-0 mt-2 w-36 bg-surface-container-lowest rounded-lg shadow-xl border border-outline-variant/30 z-20 py-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {[
                { icon: "visibility", label: "Ver",         action: () => { setViewingStudent(student); setOpenDropdownId(null); } },
                { icon: "edit",       label: "Editar",       action: () => { setSelected(student);       setOpenDropdownId(null); } },
                { icon: "badge",      label: "Carteirinha",  action: () => { setViewingCard(student);    setOpenDropdownId(null); } },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
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

  const columns = [...COLUMNS, actionsColumn];

  return (
    <>
      <main className="flex flex-col flex-1 bg-surface overflow-hidden">
        {/* Page header */}
        <div className="flex items-center justify-between px-4 pt-6 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Estudantes</h1>
            {!loading && !error && (
              <p className="text-sm text-on-surface-variant mt-1">
                {total} {total === 1 ? "estudante" : "estudantes"}{" "}
                {tab === "active" ? "ativos" : "desativados"}
              </p>
            )}
          </div>
          <Link href="/admin/students/new">
            <Button variant="primary" size="sm">Adicionar estudante</Button>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="px-4 pb-3 flex items-center justify-between gap-4 flex-wrap">
          <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome, e-mail ou instituição…"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          rows={paginated}
          rowKey={(s) => s._id}
          loading={loading}
          error={error ? <ErrorState message={error} onRetry={reload} /> : undefined}
          empty={
            <EmptyState
              icon={tab === "active" ? GraduationCap : UserX}
              title={tab === "active" ? "Nenhum estudante ativo" : "Nenhum estudante desativado"}
              description={
                search
                  ? "Nenhum estudante encontrado para esta busca."
                  : tab === "active"
                  ? "Adicione o primeiro estudante ao sistema."
                  : "Estudantes desativados aparecerão aqui."
              }
            />
          }
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => setPageSize(s as PageSize)}
          className="mx-4 mb-4"
        />
      </main>

      {selected && (
        <StudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleReload}
          onDeactivated={handleReload}
          onReactivated={handleReload}
        />
      )}
      {viewingStudent && (
        <StudentInfoModal student={viewingStudent} onClose={() => setViewingStudent(null)} />
      )}
      {viewingCardStudent && (
        <StudentCardModal student={viewingCardStudent} onClose={() => setViewingCard(null)} />
      )}
    </>
  );
}
