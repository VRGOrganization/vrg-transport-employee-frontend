"use client";

import { useEffect, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";

import { EmployeeSideNav } from "@/components/layout/EmployeeSideNav";
import { TopBar } from "@/components/layout/TopBar";
import { StudentTable } from "@/components/employee/StudentTable";
import { Footer } from "@/components/layout/Footer";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Student {
  _id: string;
  name: string;
  email: string;
  registrationId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LicenseRecord {
  _id: string;
  studentId: string;
}

interface DashboardStats {
  activeStudents: number | null;
  withCard: number | null;
  pendingRequests: number | null;
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function EmployeeDashboardPage() {
  const { user, logout } = useEmployeeAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: null,
    withCard: null,
    pendingRequests: null,
  });
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [studentsResult, licensesResult] = await Promise.allSettled([
        employeeApi.get<Student[]>("/student"),
        employeeApi.get<LicenseRecord[]>("/license/all"),
      ]);

      if (studentsResult.status === "fulfilled") {
        const activeStudents = studentsResult.value.filter((s) => s.active);
        setStudents(activeStudents);

        const licensedIds =
          licensesResult.status === "fulfilled"
            ? new Set(licensesResult.value.map((l) => l.studentId))
            : new Set<string>();

        const withCard = activeStudents.filter((s) =>
          licensedIds.has(s._id)
        ).length;

        const pending = activeStudents.filter(
          (s) => !licensedIds.has(s._id)
        ).length;

        setStats({
          activeStudents: activeStudents.length,
          withCard,
          pendingRequests: pending,
        });
      }

      setLoadingStudents(false);
    };

    fetchAll();
  }, []);

  const handleStudentUpdated = (updated: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s._id === updated._id ? updated : s))
    );
  };

  const handleStudentDeleted = (id: string) => {
    setStudents((prev) => prev.filter((s) => s._id !== id));
    setStats((prev) => ({
      ...prev,
      activeStudents:
        prev.activeStudents !== null ? prev.activeStudents - 1 : null,
    }));
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <EmployeeSideNav activePath="/employee/dashboard" onLogout={logout} />

      <div className="flex-1 ml-64 flex flex-col">
        <TopBar user={user} />

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
              icon="badge"
              label="Com Carteirinha"
              value={stats.withCard}
              badge="EMITIDAS"
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

          {/* Student Table */}
          <StudentTable
            students={students}
            loading={loadingStudents}
            onUpdated={handleStudentUpdated}
            onDeleted={handleStudentDeleted}
          />

          <div className="absolute bottom-0 left-0 w-full">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Stat Card interno ─────────────────────────────────────────────────────────

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