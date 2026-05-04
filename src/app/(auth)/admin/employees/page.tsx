"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2, UserX, AlertCircle, Users } from "lucide-react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";
import { EmployeeModal, Employee } from "@/components/admin/EmployeeModal";

type Tab = "active" | "inactive";

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function EmployeeCard({
  employee,
  onClick,
}: {
  employee: Employee;
  onClick: () => void;
}) {
  const isInactive = !employee.active;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 border rounded-2xl p-5 hover:shadow-md transition-all duration-200 text-left w-full cursor-pointer ${
        isInactive
          ? "bg-surface-container-low border-outline-variant opacity-70 hover:opacity-100"
          : "bg-surface-container-lowest border-outline-variant hover:border-primary/30"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-headline font-bold text-sm shrink-0 ${
          isInactive
            ? "bg-outline-variant text-on-surface-variant"
            : "bg-primary text-white"
        }`}
      >
        {getInitials(employee.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-on-surface truncate">{employee.name}</p>
        <p className="text-sm text-on-surface-variant truncate">
          {employee.email}
        </p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Mat. {employee.registrationId}
        </p>
      </div>
      <ChevronRight className="w-4.5 h-4.5 text-outline-variant shrink-0" />
    </button>
  );
}

function EmployeeCardSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
      <div className="w-12 h-12 rounded-full bg-surface-container-high animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-container-high rounded animate-pulse w-3/4" />
        <div className="h-3 bg-surface-container-high rounded animate-pulse w-1/2" />
        <div className="h-3 bg-surface-container-high rounded animate-pulse w-1/3" />
      </div>
    </div>
  );
}

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

  useEffect(() => {
    loadTab("active");
  }, [loadTab]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    loadTab(t);
  };

  const handleUpdated = (updated: Employee) => {
    setActive((prev) =>
      prev.map((e) => (e._id === updated._id ? updated : e))
    );
    setSelected(null);
  };

  const handleDeleted = (id: string) => {
    setActive((prev) => prev.filter((e) => e._id !== id));
    const removed = active.find((e) => e._id === id);
    if (removed) setInactive((prev) => [{ ...removed, active: false }, ...prev]);
    setSelected(null);
  };

  const displayed = tab === "active" ? active : inactive;
  const count = displayed.length;

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Side Navigation — igual ao Dashboard e Students */}
      <SideNav activePath="/admin/employees" onLogout={logout} />

      {/* Main Wrapper */}
      <div className="min-w-0 flex flex-col">
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Page Content */}
        <main className="bg-surface p-8 min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1">
                <h1 className="font-headline font-bold text-2xl text-on-surface">
                  Funcionários
                </h1>
                {!loading && !error && (
                  <p className="text-sm text-on-surface-variant">
                    {count}{" "}
                    {count === 1 ? "funcionário" : "funcionários"}{" "}
                    {tab === "active" ? "ativos" : "desativados"}
                  </p>
                )}
              </div>
              <Link href="/admin/employees/new">
                <Button variant="primary" size="sm" icon="person_add">
                  Adicionar
                </Button>
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-container-high p-1 rounded-xl mb-5 w-fit">
              {(["active", "inactive"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t === "active" ? <CheckCircle2 className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  {t === "active" ? "Ativos" : "Desativados"}
                </button>
              ))}
            </div>

            {/* Error state */}
            {error && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="w-10 h-10 text-error" />
                <p className="text-on-surface-variant">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTab(tab)}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <EmployeeCardSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && displayed.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="p-5 bg-surface-container-high rounded-full">
                  {tab === "active" ? <Users className="w-9 h-9 text-on-surface-variant" /> : <UserX className="w-9 h-9 text-on-surface-variant" />}
                </div>
                <div>
                  <p className="font-semibold text-on-surface">
                    {tab === "active"
                      ? "Nenhum funcionário ativo"
                      : "Nenhum funcionário desativado"}
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {tab === "active"
                      ? "Adicione o primeiro funcionário ao sistema"
                      : "Funcionários desativados aparecerão aqui"}
                  </p>
                </div>
                {tab === "active" && (
                  <Link href="/admin/employees/new">
                    <Button variant="primary" size="sm" icon="person_add">
                      Adicionar funcionário
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Employee list */}
            {!loading && !error && displayed.length > 0 && (
              <div className="flex flex-col gap-3">
                {displayed.map((emp) => (
                  <EmployeeCard
                    key={emp._id}
                    employee={emp}
                    onClick={() => setSelected(emp)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto w-full">
            <Footer />
          </div>
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
