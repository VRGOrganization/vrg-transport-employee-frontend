"use client";

import { useEffect, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { EmployeeTable } from "@/components/admin/EmployeeTable";
import { Footer } from "@/components/layout/Footer";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";

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

interface EnrollmentPeriodRecord {
  _id: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  filledSlots: number;
  active: boolean;
}

function formatShortDate(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const { user, logout } = useEmployeeAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: null,
    activeEmployees: null,
    pendingRequests: null,
  });
  const [activePeriod, setActivePeriod] = useState<EnrollmentPeriodRecord | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Busca os recursos em paralelo
      const [employeesResult, studentsResult, licensesResult, activePeriodResult] =
        await Promise.allSettled([
          employeeApi.get<Employee[]>("/employee"),
          employeeApi.get<StudentsResponse>("/student"),
          employeeApi.get<LicenseRecord[]>("/license/all"),
          employeeApi.get<EnrollmentPeriodRecord>("/enrollment-period/active"),
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

      if (activePeriodResult.status === "fulfilled") {
        setActivePeriod(activePeriodResult.value);
      } else {
        setActivePeriod(null);
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
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Side Navigation */}
      <SideNav activePath="/admin/dashboard" onLogout={logout} />

      {/* Main Wrapper */}
      <div className="min-w-0 flex flex-col">
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Page Content */}
        <main className="bg-surface p-8 min-h-[calc(100vh-4rem)]">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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
            <DashboardStatCard
              icon="event"
              label="Período de Inscrição"
              value={
                activePeriod
                  ? `${activePeriod.filledSlots}/${activePeriod.totalSlots} · encerra ${formatShortDate(activePeriod.endDate)}`
                  : null
              }
              badge={activePeriod ? "ABERTO" : "SEM PERÍODO"}
              accent={activePeriod ? "primary" : "tertiary"}
            />
          </div>

          {/* Employee Table */}
          <EmployeeTable
            employees={employees}
            loading={loadingEmployees}
            onUpdated={handleEmployeeUpdated}
            onDeleted={handleEmployeeDeleted}
          />

          <div className="mt-auto w-full">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}



