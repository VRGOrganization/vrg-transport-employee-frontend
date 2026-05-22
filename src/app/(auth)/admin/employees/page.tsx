"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";
import { EmployeeModal, Employee } from "@/components/admin/EmployeeModal";
import { AdminListTable, type TableColumn, type AdminTabItem } from "@/components/admin/AdminListTable";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "active" | "inactive";

// ─── Helpers (module-level, no duplication cost) ──────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-rose-100 text-rose-700",
];

const TABS: AdminTabItem[] = [
  { key: "active", label: "Ativos", icon: "check_circle" },
  { key: "inactive", label: "Desativados", icon: "person_off" },
];

const NAME_SKELETON = (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
    <div className="h-3 w-32 bg-surface-container-high rounded animate-pulse" />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const { user, logout } = useEmployeeAuth();

  const [tab, setTab] = useState<Tab>("active");
  const [active, setActive] = useState<Employee[]>([]);
  const [inactive, setInactive] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);

  const fetchActive = useCallback(async () => {
    const data = await employeeApi.get<Employee[]>("/employee");
    setActive(data);
  }, []);

  const fetchInactive = useCallback(async () => {
    const data = await employeeApi.get<Employee[]>("/employee/inactive");
    setInactive(data);
  }, []);

  const loadTab = useCallback(
    async (t: Tab) => {
      setLoading(true);
      setError("");
      try {
        if (t === "active") await fetchActive();
        else await fetchInactive();
      } catch {
        setError("Não foi possível carregar os funcionários");
      } finally {
        setLoading(false);
      }
    },
    [fetchActive, fetchInactive]
  );

  useEffect(() => { loadTab("active"); }, [loadTab]);

  const handleTabChange = (t: string) => {
    setTab(t as Tab);
    loadTab(t as Tab);
  };

  /* ── Modal callbacks ──────────────────────────────────────────────── */

  const handleUpdated = () => { setSelected(null); loadTab(tab); };
  const handleDeleted = () => { setSelected(null); loadTab(tab); };

  /* ── Derived ──────────────────────────────────────────────────────── */

  const source = tab === "active" ? active : inactive;

  /* ── Column definitions ───────────────────────────────────────────── */

  const columns: TableColumn<Employee>[] = [
    {
      key: "name",
      header: "Funcionário",
      skeleton: NAME_SKELETON,
      render: (emp, idx) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
            {getInitials(emp.name)}
          </div>
          <span className="text-sm font-medium text-on-surface">{emp.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "E-mail",
      render: (emp) => (
        <span className="text-sm text-on-surface-variant">{emp.email}</span>
      ),
    },
    {
      key: "registrationId",
      header: "Matrícula",
      render: (emp) => (
        <span className="text-sm text-on-surface-variant">{emp.registrationId}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (emp) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          emp.active
            ? "bg-success-container text-on-success"
            : "bg-surface-container-high text-on-surface-variant"
        }`}>
          {emp.active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Cadastro",
      align: "right",
      render: (emp, _idx, isMounted) => (
        <span className="text-xs text-on-surface-variant">
          {isMounted ? new Date(emp.createdAt).toLocaleDateString("pt-BR") : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ação",
      align: "right",
      render: (emp) => (
        <button
          onClick={() => setSelected(emp)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors ml-auto"
          title="Editar funcionário"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
        </button>
      ),
    },
  ];

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <div className="flex min-h-screen bg-surface">
      <SideNav activePath="/admin/employees" onLogout={logout} />

      <div className="w-full flex flex-col min-h-screen">
        <TopBar user={user} />

        <main className="flex flex-col flex-1 bg-surface overflow-hidden">

          {/* Page header */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Funcionários</h1>
              {!loading && !error && (
                <p className="text-sm text-on-surface-variant mt-1">
                  {source.length} {source.length === 1 ? "funcionário" : "funcionários"}{" "}
                  {tab === "active" ? "ativos" : "desativados"}
                </p>
              )}
            </div>
            <Link href="/admin/employees/new">
              <Button variant="primary" size="sm">Adicionar funcionário</Button>
            </Link>
          </div>

          {/* Table */}
          <AdminListTable
            rows={source}
            rowKey={(e) => e._id}
            columns={columns}
            loading={loading}
            error={error}
            onRetry={() => loadTab(tab)}
            tabs={TABS}
            tab={tab}
            onTabChange={handleTabChange}
            searchPlaceholder="Buscar por nome, e-mail ou matrícula…"
            searchFields={(e) => [e.name, e.email, e.registrationId]}
            renderEmpty={(t, hasSearch) => (
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                  {t === "active" ? "group" : "person_off"}
                </span>
                <p className="text-on-surface-variant text-sm">
                  {hasSearch
                    ? "Nenhum funcionário encontrado para esta busca."
                    : t === "active"
                    ? "Nenhum funcionário ativo."
                    : "Nenhum funcionário desativado."}
                </p>
              </div>
            )}
          />
        </main>
      </div>

      {/* Edit Modal */}
      {selected && (
        <EmployeeModal
          employee={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
