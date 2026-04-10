"use client";

import { useEffect, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";

import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { EmployeeTable } from "@/components/admin/EmployeeTable";
import { Footer } from "@/components/layout/Footer";

export interface Employee {
  _id: string;
  name: string;
  email: string;
  registrationId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StudentRecord {
  _id: string;
  active: boolean;
}

type StudentsResponse =
  | StudentRecord[]
  | {
      data?: StudentRecord[];
      total?: number;
      page?: number;
      limit?: number;
    };

interface LicenseRecord {
  _id: string;
  studentId: string;
}

interface DashboardStats {
  activeStudents: number | null;
  activeEmployees: number | null;
  pendingRequests: number | null;
}

export default function AdminDashboardPage() {
  const { user, logout } = useEmployeeAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: null,
    activeEmployees: null,
    pendingRequests: null,
  });
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Busca os 3 recursos em paralelo
      const [employeesResult, studentsResult, licensesResult] =
        await Promise.allSettled([
          employeeApi.get<Employee[]>("/employee"),
          employeeApi.get<StudentsResponse>("/student"),
          employeeApi.get<LicenseRecord[]>("/license/all"),
        ]);

      // Funcionários
      if (employeesResult.status === "fulfilled") {
        setEmployees(employeesResult.value);
        setStats((prev) => ({
          ...prev,
          activeEmployees: employeesResult.value.length,
        }));
      }

      // Alunos ativos + pendências de carteirinha
      if (studentsResult.status === "fulfilled") {
        const resolvedStudents = Array.isArray(studentsResult.value)
          ? studentsResult.value
          : Array.isArray(studentsResult.value?.data)
            ? studentsResult.value.data
            : [];

        const activeStudents = resolvedStudents.filter((s) => s.active);

        const licensedIds =
          licensesResult.status === "fulfilled"
            ? new Set(licensesResult.value.map((l) => l.studentId))
            : new Set<string>();

        const pending = activeStudents.filter(
          (s) => !licensedIds.has(s._id)
        ).length;

        setStats((prev) => ({
          ...prev,
          activeStudents: activeStudents.length,
          pendingRequests: pending,
        }));
      }

      setLoadingEmployees(false);
    };

    fetchAll();
  }, []);

  const handleEmployeeDeleted = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e._id !== id));
    setStats((prev) => ({
      ...prev,
      activeEmployees:
        prev.activeEmployees !== null ? prev.activeEmployees - 1 : null,
    }));
  };

  const handleEmployeeUpdated = (updated: Employee) => {
    setEmployees((prev) =>
      prev.map((e) => (e._id === updated._id ? updated : e))
    );
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Side Navigation */}
      <SideNav activePath="/admin/dashboard" onLogout={logout} />

      {/* Main Wrapper */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Page Content */}
        <main className="mt-16 p-8 bg-surface min-h-[calc(100vh-4rem)]">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <DashboardStatCard
              icon="school"
              label="Alunos Ativos"
              value={stats.activeStudents}
              badge="ESTATÍSTICA"
              accent="primary"
            />
            <DashboardStatCard
              icon="engineering"
              label="Funcionários Ativos"
              value={stats.activeEmployees}
              badge="EQUIPE"
              accent="tertiary"
            />
            <DashboardStatCard
              icon="pending_actions"
              label="Solicitações Pendentes"
              value={stats.pendingRequests}
              badge="URGENTE"
              accent="secondary"
            />
          </div>

          {/* Employee Table */}
          <EmployeeTable
            employees={employees}
            loading={loadingEmployees}
            onUpdated={handleEmployeeUpdated}
            onDeleted={handleEmployeeDeleted}
          />

          <div className="absolute bottom-0 left-0 w-full">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Internal stat card variant ── */
interface DashboardStatCardProps {
  icon: string;
  label: string;
  value: number | null;
  badge: string;
  accent: "primary" | "secondary" | "tertiary";
}

const accentMap = {
  primary: {
    border: "border-primary",
    icon: "text-primary",
    badge: "text-primary bg-primary-fixed",
    value: "text-primary",
  },
  secondary: {
    border: "border-secondary",
    icon: "text-secondary",
    badge: "text-on-secondary-container bg-secondary-fixed",
    value: "text-secondary",
  },
  tertiary: {
    border: "border-on-primary-fixed-variant",
    icon: "text-on-primary-fixed-variant",
    badge: "text-on-primary-fixed-variant bg-tertiary-fixed",
    value: "text-on-primary-fixed-variant",
  },
};

function DashboardStatCard({
  icon,
  label,
  value,
  badge,
  accent,
}: DashboardStatCardProps) {
  const c = accentMap[accent];
  return (
    <div
      className={`bg-surface-container-lowest p-6 rounded-xl border-l-4 ${c.border} shadow-sm hover:-translate-y-1 transition-transform duration-300`}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`material-symbols-outlined ${c.icon} text-3xl`}>
          {icon}
        </span>
        <span className={`text-xs font-bold ${c.badge} px-2 py-1 rounded`}>
          {badge}
        </span>
      </div>
      <p className="text-on-surface-variant text-sm font-medium mb-1">
        {label}
      </p>
      <h3 className={`font-headline text-3xl font-extrabold ${c.value}`}>
        {value === null ? "—" : value.toLocaleString("pt-BR")}
      </h3>
    </div>
  );
}