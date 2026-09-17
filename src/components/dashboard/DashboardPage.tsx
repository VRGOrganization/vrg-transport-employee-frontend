"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { employeeService } from "@/services/employeeService";
import { studentService } from "@/services/studentService";
import { http } from "@/services/http";
import { Download, Loader2 } from "lucide-react";
import { universityApi, busApi } from "@/lib/universityApi";
import { buildStudentsCsv, buildEmployeesCsv, buildBusesCsv, buildUniversitiesCsv, downloadCsv } from "@/lib/csvUtils";
import { resolvePaginated, type Paginated } from "@/types/api";
import { getGreeting } from "@/lib/utils/date";
import { resolveDisplayName } from "@/lib/utils/string";
import { toast } from "@/lib/toast";
import { EnrollmentPeriodBanner } from "@/components/admin/EnrollmentPeriodBanner";
import { DashboardStatCards } from "@/components/admin/dashboard/DashboardStatCards";
import { DashboardUsersTable, type UserRow, type UserFilter } from "@/components/admin/dashboard/DashboardUsersTable";
import type { PageSize } from "@/lib/constants";
import type { Student } from "@/types/student";

// ─── Constants ────────────────────────────────────────────────────────────────

// Teto de `limit` aceito por GET /student no backend. A tabela de usuários
// mostra a página mais recente; os KPIs não dependem mais desta lista.
const STUDENT_PAGE_LIMIT = 100;

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRecord {
  _id: string;
  name: string;
  socialName?: string | null;
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

interface LicenseRecord {
  _id: string;
  studentId: string;
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

interface DashboardPageProps {
  role: "admin" | "employee";
}

export function DashboardPage({ role }: DashboardPageProps) {
  const isAdmin = role === "admin";
  const base = isAdmin ? "/admin" : "/employee";

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
  const [tableError, setTableError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const [filter, setFilter] = useState<UserFilter>("Todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    setLoadingTable(true);
    setTableError("");

    const fetchAdmin = async () => {
      const [
        employeesResult,
        studentsResult,
        studentStatsResult,
        activePeriodResult,
        fleetCapacityResult,
      ] = await Promise.allSettled([
        employeeService.list(),
        // `limit` explícito: sem ele a API pagina em 20 e a tabela abaixo
        // mostrava só as 20 primeiras linhas.
        http
          .get<Paginated<StudentRecord>>(`/student?limit=${STUDENT_PAGE_LIMIT}`)
          .then(resolvePaginated),
        // Os KPIs de contagem vêm do censo agregado, não da página acima.
        studentService.dashboardStats(),
        http.get<EnrollmentPeriodRecord>("/enrollment-period/active"),
        busApi.fleetCapacity(),
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

      // Contagens vindas do censo agregado no banco. Antes saíam da lista
      // paginada de /student, o que travava os KPIs no tamanho da página.
      if (studentStatsResult.status === "fulfilled") {
        const censo = studentStatsResult.value;
        setStats((prev) => ({
          ...prev,
          activeStudents: censo.totalStudents,
          pendingStudents: censo.studentsWithPendingRequest,
        }));
      }

      if (studentsResult.status === "fulfilled") {
        for (const stu of resolvedStudents) {
          rows.push({
            id: stu._id,
            name: resolveDisplayName(stu),
            searchAliases: stu.socialName?.trim() ? [stu.name] : undefined,
            identifier: stu.email,
            type: "Aluno",
            status: stu.status === "PENDING" ? "Pendente" : stu.active ? "Ativo" : "Inativo",
            createdAt: stu.createdAt,
          });
        }
      }

      const activePeriod =
        activePeriodResult.status === "fulfilled" ? activePeriodResult.value : null;
      // Fora de janela de inscrição o backend devolve null aqui (vira {} no
      // http client), então `totalSlots` não é número.
      const hasActivePeriod = !!activePeriod && typeof activePeriod.totalSlots === "number";
      setActivePeriod(hasActivePeriod ? activePeriod : null);

      if (hasActivePeriod) {
        setStats((prev) => ({
          ...prev,
          fleetLabel: `${activePeriod.filledSlots}/${activePeriod.totalSlots}`,
        }));
      } else if (fleetCapacityResult.status === "fulfilled") {
        // Sem ciclo ativo nada está ocupado, mas a capacidade da frota existe
        // e é o que o card deve mostrar — antes ficava "-".
        setStats((prev) => ({
          ...prev,
          fleetLabel: `0/${fleetCapacityResult.value.totalSlots}`,
        }));
      }

      if (employeesResult.status === "rejected" || studentsResult.status === "rejected") {
        setTableError("Não foi possível carregar a lista completa de usuários. Tente novamente.");
      }

      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUserRows(rows);
      setLoadingTable(false);
    };

    const fetchEmployee = async () => {
      const [studentsResult, licensesResult] = await Promise.allSettled([
        studentService.list(),
        http.get<Paginated<LicenseRecord>>("/license/all").then(resolvePaginated),
      ]);

      const students: Student[] =
        studentsResult.status === "fulfilled" ? studentsResult.value : [];
      const activeStudents = students.filter((s) => s.active);

      const licenses: LicenseRecord[] =
        licensesResult.status === "fulfilled" ? licensesResult.value : [];
      const licensedIds = new Set(licenses.map((l) => l.studentId));

      setStats((prev) => ({
        ...prev,
        activeStudents: activeStudents.length,
        pendingStudents: activeStudents.filter((s) => !licensedIds.has(s._id)).length,
      }));

      const rows: UserRow[] = students.map((stu) => ({
        id: stu._id,
        name: resolveDisplayName(stu),
        searchAliases: stu.socialName?.trim() ? [stu.name] : undefined,
        identifier: stu.email,
        type: "Aluno",
        status: stu.active ? "Ativo" : "Inativo",
        createdAt: stu.createdAt,
      }));

      if (studentsResult.status === "rejected") {
        setTableError("Não foi possível carregar a lista de alunos. Tente novamente.");
      }

      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUserRows(rows);
      setLoadingTable(false);
    };

    void (isAdmin ? fetchAdmin() : fetchEmployee());
  }, [isAdmin, reloadTick]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = userRows
    .filter((r) => filter === "Todos" || r.type === filter)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.identifier.toLowerCase().includes(q) ||
        (r.searchAliases ?? []).some((alias) => alias.toLowerCase().includes(q))
      );
    });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleFilterChange = (f: UserFilter) => { setFilter(f); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  // ── Export (admin only) ──────────────────────────────────────────────────────

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

  const handleRowClick = (row: UserRow) => {
    if (row.type === "Aluno") router.push(`${base}/students?view=${row.id}`);
    else router.push(`/admin/employees?view=${row.id}`);
  };

  const pendingLabel =
    stats.pendingStudents === null ? "…" :
    stats.pendingStudents === 1 ? "1 solicitação de licença pendente de aprovação" :
    `${stats.pendingStudents} solicitações de licença pendentes de aprovação`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="px-6 py-5 bg-surface flex flex-col gap-5 min-w-0 overflow-x-hidden">

      {isAdmin && activePeriod?.endDate && (
        <EnrollmentPeriodBanner endDate={activePeriod.endDate} />
      )}

      {/* ── Page header ──────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-extrabold text-on-surface tracking-tight">
          {user?.name ? getGreeting(user.name.split(" ")[0]) : "Bom dia"}
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          {getTodayLabel()} · {pendingLabel}
        </p>
      </div>

      {/* ── Stat cards ───────────────────────────────────── */}
      <DashboardStatCards
        role={role}
        activeStudents={stats.activeStudents}
        activeEmployees={stats.activeEmployees}
        pendingStudents={stats.pendingStudents}
        fleetLabel={stats.fleetLabel}
      />

      {/* ── Users table ──────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {isAdmin && (
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
        )}
        <DashboardUsersTable
          role={role}
          rows={paginated}
          totalFiltered={filtered.length}
          totalAll={userRows.length}
          loading={loadingTable}
          error={tableError}
          onRetry={() => setReloadTick((t) => t + 1)}
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
