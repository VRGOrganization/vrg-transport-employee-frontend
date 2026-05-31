"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Users, UserX } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { EmployeeModal } from "@/components/employees/EmployeeModal";
import { EmployeeInfoModal } from "@/components/employees/EmployeeInfoModal";
import type { Employee } from "@/types/employee";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { useListPage } from "@/hooks/ui/useListPage";
import { buildEmployeesCsv, downloadCsv } from "@/lib/csvUtils";
import type { PageSize } from "@/lib/constants";

type Tab = "active" | "inactive";

const TAB_ITEMS = [
  { key: "active" as Tab,   label: "Ativos",      icon: "check_circle" },
  { key: "inactive" as Tab, label: "Desativados",  icon: "person_off"  },
];

const COLUMNS: Column<Employee>[] = [
  {
    key: "name",
    label: "Funcionário",
    render: (e) => (
      <div className="flex items-center gap-3">
        <Avatar name={e.name} size="sm" />
        <span className="text-sm font-medium text-on-surface">{e.name}</span>
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
    render: (e) => <span className="text-sm text-on-surface-variant">{e.email}</span>,
  },
  {
    key: "registrationId",
    label: "Matrícula",
    render: (e) => <span className="text-sm text-on-surface-variant">{e.registrationId}</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (e) => (
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          e.active
            ? "bg-success-container text-on-success"
            : "bg-surface-container-high text-on-surface-variant"
        }`}
      >
        {e.active ? "Ativo" : "Inativo"}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Cadastro",
    align: "right",
    render: (e) => (
      <span className="text-xs text-on-surface-variant">
        {new Date(e.createdAt).toLocaleDateString("pt-BR")}
      </span>
    ),
  },
];

export default function EmployeesPage() {
  const [selected, setSelected]           = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [openDropdownId, setOpenDropdownId]   = useState<string | null>(null);

  const fetcher = useCallback(
    (t: Tab) => (t === "active" ? employeeService.list() : employeeService.listInactive()),
    [],
  );

  const { tab, setTab, search, setSearch, page, setPage, pageSize, setPageSize,
    loading, error, filtered, paginated, total, reload } =
    useListPage<Employee, Tab>({
      tabs: ["active", "inactive"],
      initialTab: "active",
      fetcher,
      searchFields: (e) => [e.name, e.email, e.registrationId],
    });

  const handleReload = () => { setSelected(null); reload(); };

  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const label = tab === "active" ? "ativos" : "desativados";
      downloadCsv(buildEmployeesCsv(filtered), `funcionarios_${label}_${today}.csv`);
    } finally {
      setExportLoading(false);
    }
  };

  const actionsColumn: Column<Employee> = {
    key: "actions",
    label: "Ação",
    align: "right",
    render: (emp) => (
      <div className="relative inline-block text-left">
        <button
          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === emp._id ? null : emp._id); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors ml-auto"
        >
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>
        {openDropdownId === emp._id && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
            <div className="absolute right-0 mt-2 w-36 bg-surface-container-lowest rounded-lg shadow-xl border border-outline-variant/30 z-20 py-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {[
                { icon: "visibility", label: "Ver",    action: () => { setViewingEmployee(emp); setOpenDropdownId(null); } },
                { icon: "edit",       label: "Editar", action: () => { setSelected(emp);         setOpenDropdownId(null); } },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={(e) => { e.stopPropagation(); action(); }}
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
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Funcionários</h1>
            {!loading && !error && (
              <p className="text-sm text-on-surface-variant mt-1">
                {total} {total === 1 ? "funcionário" : "funcionários"}{" "}
                {tab === "active" ? "ativos" : "desativados"}
              </p>
            )}
          </div>
          <Link href="/admin/employees/new">
            <Button variant="primary" size="sm">Adicionar funcionário</Button>
          </Link>
        </div>

        {/* Toolbar — only tabs; search and export live inside the DataTable */}
        <div className="px-4 pb-3">
          <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          rows={paginated}
          rowKey={(e) => e._id}
          onRowClick={(e) => setViewingEmployee(e)}
          loading={loading}
          error={error ? <ErrorState message={error} onRetry={reload} /> : undefined}
          empty={
            <EmptyState
              icon={tab === "active" ? Users : UserX}
              title={tab === "active" ? "Nenhum funcionário ativo" : "Nenhum funcionário desativado"}
              description={
                search
                  ? "Nenhum funcionário encontrado para esta busca."
                  : tab === "active"
                  ? "Cadastre o primeiro funcionário no sistema."
                  : "Funcionários desativados aparecerão aqui."
              }
            />
          }
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => setPageSize(s as PageSize)}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Buscar por nome, e-mail ou matrícula…",
          }}
          onExport={handleExport}
          exportLoading={exportLoading}
          exportLabel={tab === "active" ? "Exportar Ativos" : "Exportar Desativados"}
          className="mx-4 mb-4"
        />
      </main>

      {viewingEmployee && (
        <EmployeeInfoModal
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          onEdit={() => { setSelected(viewingEmployee); setViewingEmployee(null); }}
        />
      )}
      {selected && (
        <EmployeeModal
          employee={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleReload}
          onDeleted={handleReload}
        />
      )}
    </>
  );
}
