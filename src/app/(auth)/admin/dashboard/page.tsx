"use client";

import { useEffect, useState } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { employeeService } from "@/services/employeeService";
import { http } from "@/services/http";
import { Calendar } from "lucide-react";
import { universityApi, busApi } from "@/lib/universityApi";
import { buildStudentsCsv, buildEmployeesCsv, buildBusesCsv, buildUniversitiesCsv, downloadCsv } from "@/lib/csvUtils";
import { resolvePaginated, type Paginated } from "@/types/api";
import { getGreeting } from "@/lib/utils/date";
import { EnrollmentPeriodBanner } from "@/components/admin/EnrollmentPeriodBanner";
import { DashboardStatCards } from "@/components/admin/dashboard/DashboardStatCards";
import { DashboardUsersTable, type UserRow, type UserFilter } from "@/components/admin/dashboard/DashboardUsersTable";
import type { PageSize } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRecord {
  _id: string;
  name: string;
  email: string;
  institution?: string;
  shift?: string;
  active: boolean;
  status: "PENDING" | "ACTIVE";
  createdAt: string;
}

interface EnrollmentPeriodRecord {
  _id: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  filledSlots: number;
  active: boolean;
}

interface DashboardStats {
  activeStudents: number | null;
  activeEmployees: number | null;
  pendingStudents: number | null;
  fleetLabel: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useEmployeeAuth();

  const [activePeriod, setActivePeriod] = useState<EnrollmentPeriodRecord | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: null,
    activeEmployees: null,
    pendingStudents: null,
    fleetLabel: null,
  });

  const [userRows, setUserRows] = useState<UserRow[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [filter, setFilter] = useState<UserFilter>("Todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [employeesResult, studentsResult, activePeriodResult, requestsResult] =
        await Promise.allSettled([
          employeeService.list(),
          http.get<Paginated<StudentRecord>>("/student").then(resolvePaginated),
          http.get<EnrollmentPeriodRecord>("/enrollment-period/active"),
          http.get<Paginated<unknown>>("/license-request/all").then(resolvePaginated),
        ]);

      const rows: UserRow[] = [];
      const resolvedStudents: StudentRecord[] =
        studentsResult.status === "fulfilled" ? studentsResult.value : [];

      if (employeesResult.status === "fulfilled") {
        const all = employeesResult.value;
        setStats((prev) => ({
          ...prev,
          activeEmployees: all.filter((e) => e.active).length,
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
        setStats((prev) => ({
          ...prev,
          activeStudents: resolvedStudents.filter((s) => s.status === "ACTIVE" && s.active).length,
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
        const requests = requestsResult.value;
        const pendingIds = new Set(
          requests
            .filter((r: any) => r.status === "pending")
            .map((r: any) => (typeof r.studentId === "object" ? r.studentId?._id : r.studentId))
            .filter(Boolean),
        );
        setStats((prev) => ({
          ...prev,
          pendingStudents: resolvedStudents.filter((s) => s.active && pendingIds.has(s._id)).length,
        }));
      }

      if (activePeriodResult.status === "fulfilled") {
        const p = activePeriodResult.value;
        setActivePeriod(p ?? null);
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

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = userRows
    .filter((r) => filter === "Todos" || r.type === filter)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.identifier.toLowerCase().includes(q);
    });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleFilterChange = (f: UserFilter) => { setFilter(f); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExportLoading(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      if (filter === "Aluno") {
        const students = await http.get<Paginated<StudentRecord>>("/student").then(resolvePaginated);
        downloadCsv(buildStudentsCsv(students), `alunos_${today}.csv`);
        return;
      }
      if (filter === "Funcionário") {
        const emps = await employeeService.list();
        downloadCsv(buildEmployeesCsv(emps), `funcionarios_${today}.csv`);
        return;
      }
      // "Todos" — 4 arquivos separados
      const [studentsRes, empsRes, busesRes, unisRes] = await Promise.all([
        http.get<Paginated<StudentRecord>>("/student").then(resolvePaginated),
        employeeService.list(),
        busApi.listWithQueueCounts(),
        universityApi.list(),
      ]);
      const buses = Array.isArray(busesRes) ? busesRes : [];
      const unis = Array.isArray(unisRes) ? unisRes : [];

      downloadCsv(buildStudentsCsv(studentsRes), `alunos_${today}.csv`);
      await new Promise((r) => setTimeout(r, 300));
      downloadCsv(buildEmployeesCsv(empsRes), `funcionarios_${today}.csv`);
      await new Promise((r) => setTimeout(r, 300));
      downloadCsv(buildBusesCsv(buses), `frotas_${today}.csv`);
      await new Promise((r) => setTimeout(r, 300));
      downloadCsv(buildUniversitiesCsv(unis), `faculdades_${today}.csv`);
    } catch (err) {
      console.error("Erro ao exportar dados:", err);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };

  const exportLabel =
    filter === "Aluno" ? "Exportar Alunos" :
    filter === "Funcionário" ? "Exportar Funcionários" :
    "Exportar Todos (4 arquivos)";

  const exportTooltip =
    filter === "Aluno" ? "Exportar dados dos alunos em CSV" :
    filter === "Funcionário" ? "Exportar dados dos funcionários em CSV" :
    "Exportar 4 arquivos CSV separados: Alunos, Funcionários, Frota e Faculdades";

  // ── Month label ────────────────────────────────────────────────────────────

  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthLabel = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="px-6 py-5 bg-surface flex flex-col gap-5">

      {activePeriod?.endDate && (
        <EnrollmentPeriodBanner endDate={activePeriod.endDate} />
      )}

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-on-surface tracking-tight">
            {user?.name ? getGreeting(user.name.split(" ")[0]) : "Bom dia"}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {getTodayLabel()} · {stats.pendingStudents ?? "…"} itens precisam da sua atenção hoje.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">
          <Calendar className="w-4 h-4" />
          {monthLabel}
        </button>
      </div>

      {/* ── Stat cards ───────────────────────────────────── */}
      <DashboardStatCards
        activeStudents={stats.activeStudents}
        activeEmployees={stats.activeEmployees}
        pendingStudents={stats.pendingStudents}
        fleetLabel={stats.fleetLabel}
      />

      {/* ── Users table ──────────────────────────────────── */}
      <DashboardUsersTable
        rows={paginated}
        totalFiltered={filtered.length}
        totalAll={userRows.length}
        loading={loadingTable}
        filter={filter}
        onFilterChange={handleFilterChange}
        search={search}
        onSearch={handleSearch}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportLoading={exportLoading}
        onExport={handleExport}
        exportLabel={exportLabel}
        exportTooltip={exportTooltip}
      />

    </main>
  );
}
