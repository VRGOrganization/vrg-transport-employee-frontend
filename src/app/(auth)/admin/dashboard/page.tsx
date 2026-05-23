"use client";

import { useEffect, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { Calendar } from "lucide-react";
import { universityApi, busApi } from "@/lib/universityApi";
import {
  buildStudentsCsv,
  buildEmployeesCsv,
  buildBusesCsv,
  buildUniversitiesCsv,
  downloadCsv,
} from "@/lib/csvUtils";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardStatCards, type DashboardStats } from "@/components/admin/DashboardStatCards";
import { DashboardUsersTable, type UserRow, type FilterType } from "@/components/admin/DashboardUsersTable";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
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
  name: string;
  email: string;
  telephone?: string;
  institution?: string;
  shift?: string;
  active: boolean;
  status: "PENDING" | "ACTIVE";
  createdAt: string;
}

type StudentsResponse =
  | StudentRecord[]
  | { data?: StudentRecord[]; total?: number; page?: number; limit?: number };

interface EnrollmentPeriodRecord {
  _id: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  filledSlots: number;
  active: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const g = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return `${g}, ${name.split(" ")[0]}`;
}

function getTodayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, logout } = useEmployeeAuth();

  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: null,
    activeEmployees: null,
    inactiveEmployees: null,
    pendingStudents: null,
    fleetLabel: null,
  });

  const [userRows, setUserRows] = useState<UserRow[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [employeesResult, studentsResult, activePeriodResult, requestsResult] =
        await Promise.allSettled([
          employeeApi.get<Employee[]>("/employee"),
          employeeApi.get<StudentsResponse>("/student"),
          employeeApi.get<EnrollmentPeriodRecord>("/enrollment-period/active"),
          employeeApi.get<any[]>("/license-request/all"),
        ]);

      const rows: UserRow[] = [];
      let resolvedStudents: StudentRecord[] = [];

      if (employeesResult.status === "fulfilled") {
        const raw = employeesResult.value;
        const all: Employee[] = Array.isArray(raw) ? raw : ((raw as { data?: Employee[] }).data ?? []);
        setStats((prev) => ({
          ...prev,
          activeEmployees: all.filter((e: any) => e.active).length,
          inactiveEmployees: all.filter((e: any) => !e.active).length,
        }));
        for (const emp of all) {
          rows.push({
            id: emp._id,
            name: emp.name,
            identifier: emp.registrationId ?? emp.email,
            type: "Funcionário",
            status: emp.active ? "Ativo" : "Inativo",
            createdAt: emp.createdAt,
          });
        }
      }

      if (studentsResult.status === "fulfilled") {
        resolvedStudents = Array.isArray(studentsResult.value)
          ? studentsResult.value
          : Array.isArray((studentsResult.value as { data?: StudentRecord[] }).data)
            ? ((studentsResult.value as { data: StudentRecord[] }).data ?? [])
            : [];

        const activeStudents = resolvedStudents.filter((s) => s.status === "ACTIVE" && s.active);

        setStats((prev) => ({
          ...prev,
          activeStudents: activeStudents.length,
        }));

        for (const stu of resolvedStudents) {
          rows.push({
            id: stu._id,
            name: stu.name,
            identifier: stu.email,
            type: "Aluno",
            status: stu.status === "PENDING" ? "Pendente" : stu.active ? "Ativo" : "Inativo",
            createdAt: stu.createdAt,
          });
        }
      }

      if (requestsResult.status === "fulfilled") {
        const rawReq = requestsResult.value;
        const requests: any[] = Array.isArray(rawReq) ? rawReq : ((rawReq as { data?: any[] }).data ?? []);
        const pendingStudentIds = new Set(
          requests
            .filter((r: any) => r.status === "pending")
            .map((r: any) => (typeof r.studentId === "object" ? r.studentId?._id : r.studentId))
            .filter(Boolean)
        );

        const pendingCount = resolvedStudents.filter((s) => s.active && pendingStudentIds.has(s._id)).length;

        setStats((prev) => ({
          ...prev,
          pendingStudents: pendingCount,
        }));
      }

      if (activePeriodResult.status === "fulfilled") {
        const p = activePeriodResult.value;
        setStats((prev) => ({
          ...prev,
          fleetLabel: `${p.filledSlots}/${p.totalSlots}`,
        }));
      }

      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUserRows(rows);
      setLoadingTable(false);
    };

    void fetchAll();
  }, []);

  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthLabel = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  const handleExport = async (filter: FilterType) => {
    setExportLoading(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      if (filter === "Aluno") {
        const res = await employeeApi.get<StudentsResponse>("/student");
        const students = Array.isArray(res) ? res : ((res as { data?: StudentRecord[] }).data ?? []);
        downloadCsv(buildStudentsCsv(students), `alunos_${today}.csv`);
        return;
      }

      if (filter === "Funcionário") {
        const res = await employeeApi.get<Employee[] | { data?: Employee[] }>("/employee");
        const emps = Array.isArray(res) ? res : ((res as { data?: Employee[] }).data ?? []);
        downloadCsv(buildEmployeesCsv(emps), `funcionarios_${today}.csv`);
        return;
      }

      // "Todos" — arquivo combinado com seções para cada entidade
      const [studentsRes, employeesRes, busesRes, universitiesRes] = await Promise.all([
        employeeApi.get<StudentsResponse>("/student"),
        employeeApi.get<Employee[] | { data?: Employee[] }>("/employee"),
        busApi.list(),
        universityApi.list(),
      ]);

      const students = Array.isArray(studentsRes) ? studentsRes : ((studentsRes as { data?: StudentRecord[] }).data ?? []);
      const employees = Array.isArray(employeesRes) ? employeesRes : ((employeesRes as { data?: Employee[] }).data ?? []);
      const buses = Array.isArray(busesRes) ? busesRes : [];
      const universities = Array.isArray(universitiesRes) ? universitiesRes : [];

      const combined = [
        "ALUNOS\n" + buildStudentsCsv(students),
        "FUNCIONÁRIOS\n" + buildEmployeesCsv(employees),
        "FROTA (ÔNIBUS)\n" + buildBusesCsv(buses),
        "INSTITUIÇÕES\n" + buildUniversitiesCsv(universities),
      ].join("\n\n");

      downloadCsv(combined, `exportacao_completa_${today}.csv`);
    } catch (err) {
      console.error("Erro ao exportar dados:", err);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <SideNav activePath="/admin/dashboard" onLogout={logout} />

      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />

        <main className="px-6 py-5 bg-surface flex flex-col gap-5">

          {/* ── Page header ──────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-on-surface tracking-tight">
                {user?.name ? getGreeting(user.name) : "Bom dia"}
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {getTodayLabel()} · {stats.pendingStudents ?? "…"} itens precisam da sua atenção hoje.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">
                <Calendar className="w-4 h-4" />
                {monthLabel}
              </button>
            </div>
          </div>

          {/* ── Stat cards ───────────────────────────────────── */}
          <DashboardStatCards stats={stats} />

          {/* ── Users table ──────────────────────────────────── */}
          <DashboardUsersTable
            rows={userRows}
            loading={loadingTable}
            exportLoading={exportLoading}
            onExport={handleExport}
          />

        </main>
      </div>
    </div>
  );
}
