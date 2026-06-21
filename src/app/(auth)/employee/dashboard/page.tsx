"use client";

import { useEffect, useState } from "react";
import { studentService } from "@/services/studentService";
import { licenseRequestService } from "@/services/licenseRequestService";
import { http } from "@/services/http";
import { StudentTable } from "@/components/employee/StudentTable";
import { Footer } from "@/components/layout/Footer";
import type { Student } from "@/types/student";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface LicenseRecord {
  _id: string;
  studentId: string;
}

interface DashboardStats {
  activeStudents: number | null;
  withCard: number | null;
  pendingRequests: number | null;
  documentResendCount: number | null;
  reissueCount: number | null;
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function EmployeeDashboardPage() {

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: null,
    withCard: null,
    pendingRequests: null,
    documentResendCount: null,
    reissueCount: null,
  });
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [studentsResult, licensesResult, reviewCountsResult] = await Promise.allSettled([
        studentService.list(),
        http.get<LicenseRecord[]>("/license/all"),
        licenseRequestService.getReviewCounts(),
      ]);

      if (studentsResult.status === "fulfilled") {
        const resolvedStudents = studentsResult.value;
        const activeStudents = resolvedStudents.filter((s: Student) => s.active);
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
          documentResendCount:
            reviewCountsResult.status === "fulfilled"
              ? reviewCountsResult.value.documentResendCount
              : null,
          reissueCount:
            reviewCountsResult.status === "fulfilled"
              ? reviewCountsResult.value.reissueCount
              : null,
        });
      }

      setLoadingStudents(false);
    };

    fetchAll();
  }, []);

  const handleStudentDeleted = (id: string) => {
    setStudents((prev) => prev.filter((s) => s._id !== id));
    setStats((prev) => ({
      ...prev,
      activeStudents:
        prev.activeStudents !== null ? prev.activeStudents - 1 : null,
    }));
  };

  return (
    <main className="bg-surface p-8 min-h-[calc(100vh-4rem)] flex flex-col">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
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
            <DashboardStatCard
              icon="upload_file"
              label="Reenvio de documentos"
              value={stats.documentResendCount}
              badge="REVISÃO"
              accent="secondary"
            />
            <DashboardStatCard
              icon="event_repeat"
              label="Reemissão por dia"
              value={stats.reissueCount}
              badge="REVISÃO"
              accent="tertiary"
            />
          </div>

          {/* Student Table */}
          <StudentTable
            students={students}
            loading={loadingStudents}
            onDeleted={handleStudentDeleted}
          />

          <div className="mt-auto w-full">
            <Footer />
          </div>
    </main>
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
