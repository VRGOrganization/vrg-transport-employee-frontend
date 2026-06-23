"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { employeeService } from "@/services/employeeService";
import { http } from "@/services/http";
import { Calendar, Download, Loader2 } from "lucide-react";
import { universityApi, busApi } from "@/lib/universityApi";
import { buildStudentsCsv, buildEmployeesCsv, buildBusesCsv, buildUniversitiesCsv, downloadCsv } from "@/lib/csvUtils";
import { resolvePaginated, type Paginated } from "@/types/api";
import { getGreeting } from "@/lib/utils/date";
import { toast } from "@/lib/toast";
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
  const router = useRouter();

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
          http.get<Paginated<unknown>>("/license-request").then(resolvePaginated),
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
        const hasActivePeriod = !!p && typeof p.totalSlots === "number";
        setActivePeriod(hasActivePeriod ? p : null);
        if (hasActivePeriod) {
          setStats((prev) => ({
            ...prev,
            fleetLabel: `${p.filledSlots}/${p.totalSlots}`,
          }));
        }
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
      toast.success("Dados exportados com sucesso! 4 arquivos CSV foram baixados.");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.error("Erro ao exportar dados:", err);
      toast.error("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Month label ────────────────────────────────────────────────────────────

  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthLabel = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  const handleRowClick = (row: import("@/components/admin/dashboard/DashboardUsersTable").UserRow) => {
    if (row.type === "Aluno") router.push(`/admin/students?view=${row.id}`);
    else router.push(`/admin/employees?view=${row.id}`);
  };

  const pendingLabel =
    stats.pendingStudents === null ? "…" :
    stats.pendingStudents === 1 ? "1 solicitação de licença pendente de aprovação" :
    `${stats.pendingStudents} solicitações de licença pendentes de aprovação`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="px-6 py-5 bg-surface flex flex-col gap-5 min-w-0 overflow-x-hidden">

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
            {getTodayLabel()} · {pendingLabel}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">
          <Calendar className="size-4" />
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
      <div className="flex flex-col gap-2">
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            title="Exportar 4 arquivos CSV: Alunos, Funcionários, Frota e Faculdades"
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait shrink-0 whitespace-nowrap"
          >
            {exportLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {exportLoading ? "Exportando..." : "Exportar"}
          </button>
        </div>
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
          onRowClick={handleRowClick}
        />
      </div>

    </main>
  );
}
