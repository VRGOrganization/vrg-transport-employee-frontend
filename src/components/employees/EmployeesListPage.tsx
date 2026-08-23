"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, UserX, CheckCircle2, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { EmployeeModal } from "@/components/employees/EmployeeModal";
import { EmployeeInfoModal } from "@/components/employees/EmployeeInfoModal";
import { EmployeeCreateModal } from "@/components/employees/EmployeeCreateModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Employee } from "@/types/employee";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { useListPage } from "@/hooks/ui/useListPage";
import { buildEmployeesCsv, downloadCsv } from "@/lib/csvUtils";
import { toast } from "@/lib/toast";
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
        <div className="size-9 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
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

export function EmployeesListPage({ role }: { role: "admin" | "employee" }) {
  const [selected, setSelected]             = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget]   = useState<Employee | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError]     = useState("");
  const [createOpen, setCreateOpen]       = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("view");
    if (!id) return;
    employeeService.getById(id).then(setViewingEmployee).catch(() => {});
  }, []);

  const [sortAsc, setSortAsc] = useState(true);

  const fetcher = useCallback(
    (t: Tab) => (t === "active" ? employeeService.list() : employeeService.listInactive()),
    [],
  );

  const sortFn = useCallback(
    (a: Employee, b: Employee) =>
      sortAsc
        ? a.name.localeCompare(b.name, "pt-BR")
        : b.name.localeCompare(a.name, "pt-BR"),
    [sortAsc],
  );

  const { tab, setTab, search, setSearch, page, setPage, pageSize, setPageSize,
    loading, error, filtered, paginated, total, reload, reloadAll } =
    useListPage<Employee, Tab>({
      tabs: ["active", "inactive"],
      initialTab: "active",
      fetcher,
      searchFields: (e) => [e.name, e.email, e.registrationId],
      reloadOnTabChange: true,
      sortFn,
    });

  const handleReload = () => { setSelected(null); reloadAll(); };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true);
    setToggleError("");
    try {
      if (toggleTarget.active) {
        await employeeService.deactivate(toggleTarget._id);
        toast.success("Funcionário desativado com sucesso.");
      } else {
        await employeeService.reactivate(toggleTarget._id);
        toast.success("Funcionário reativado com sucesso.");
      }
      setToggleTarget(null);
      reloadAll();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setToggleError(e.message ?? "Erro ao atualizar status do funcionário");
    } finally {
      setToggleLoading(false);
    }
  };

  const statusColumn: Column<Employee> = {
    key: "status",
    label: "Status",
    render: (e) => (
      <button
        onClick={(ev) => { ev.stopPropagation(); setToggleTarget(e); }}
        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
          e.active
            ? "bg-success-container text-on-success border-success/30 hover:bg-success/20 hover:border-success/50"
            : "bg-surface-container-high text-on-surface-variant border-outline-variant/50 hover:bg-surface-container-highest hover:border-outline-variant"
        }`}
      >
        {e.active ? "Ativo" : "Inativo"}
      </button>
    ),
  };

  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const label = tab === "active" ? "ativos" : "desativados";
      downloadCsv(buildEmployeesCsv(filtered), `funcionarios_${label}_${today}.csv`);
      toast.success(`${total} funcionário${total !== 1 ? "s" : ""} exportado${total !== 1 ? "s" : ""} com sucesso.`);
    } catch {
      toast.error("Erro ao exportar. Tente novamente.");
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
          className="size-8 rounded-lg flex items-center justify-center cursor-pointer text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors ml-auto"
        >
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>
        {openDropdownId === emp._id && (
          <>
            <div className="fixed inset-0 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
            <div className="absolute right-0 mt-2 w-36 bg-surface-container-lowest rounded-lg shadow-xl border border-outline-variant/30 z-20 py-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {[
                { icon: "visibility", label: "Ver",    action: () => { setViewingEmployee(emp); setOpenDropdownId(null); } },
                { icon: "edit",       label: "Editar", action: () => { setSelected(emp);         setOpenDropdownId(null); } },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={(e) => { e.stopPropagation(); action(); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium cursor-pointer text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
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

  const columns: Column<Employee>[] = [COLUMNS[0], COLUMNS[1], COLUMNS[2], statusColumn, COLUMNS[3], actionsColumn];

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
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            Adicionar funcionário
          </Button>
        </div>

        {/* Toolbar */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-on-surface-variant border border-outline-variant/50 bg-surface-container hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            {sortAsc ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}
            {sortAsc ? "A–Z" : "Z–A"}
          </button>
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
          canDelete={role === "admin"}
          onDeleted={() => { setViewingEmployee(null); reloadAll(); }}
        />
      )}
      {createOpen && (
        <EmployeeCreateModal
          open
          onClose={() => setCreateOpen(false)}
          onCreated={reloadAll}
        />
      )}
      {selected && (
        <EmployeeModal
          employee={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleReload}
          onDeleted={handleReload}
          canDelete={role === "admin"}
        />
      )}
      {toggleTarget && (
        <ConfirmModal
          open
          onClose={() => { setToggleError(""); setToggleTarget(null); }}
          onConfirm={handleConfirmToggle}
          loading={toggleLoading}
          error={toggleError}
          title={toggleTarget.active ? "Desativar funcionário?" : "Reativar funcionário?"}
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
    </>
  );
}
