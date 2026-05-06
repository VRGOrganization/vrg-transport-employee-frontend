"use client";

import { useEffect, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { GraduationCap, Users, ClipboardList, Bus, Calendar, Download, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { DashboardStatCard } from "@/components/cards/DashboardStatCard";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  name: string;
  email: string;
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

interface DashboardStats {
  activeStudents: number | null;
  activeEmployees: number | null;
  inactiveEmployees: number | null;
  pendingStudents: number | null;
  fleetLabel: string | null;
}

interface UserRow {
  id: string;
  name: string;
  identifier: string;
  type: "Aluno" | "Funcionário";
  status: "Ativo" | "Pendente" | "Inativo";
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = [
  "bg-primary-fixed text-primary",
  "bg-secondary-fixed text-secondary",
  "bg-tertiary-container text-tertiary",
  "bg-info-container text-on-info",
  "bg-success-container text-on-success",
  "bg-warning-container text-on-warning",
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

const TYPE_STYLE: Record<string, string> = {
  Aluno: "bg-primary-fixed text-primary",
  Funcionário: "bg-secondary-fixed text-secondary",
};

const STATUS_STYLE: Record<string, string> = {
  Ativo: "bg-success-container text-on-success",
  Pendente: "bg-warning-container text-on-warning",
  Inativo: "bg-surface-container-high text-on-surface-variant",
};

const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"Todos" | "Aluno" | "Funcionário">("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const [employeesResult, studentsResult, activePeriodResult] =
        await Promise.allSettled([
          employeeApi.get<Employee[]>("/employee"),
          employeeApi.get<StudentsResponse>("/student"),
          employeeApi.get<EnrollmentPeriodRecord>("/enrollment-period/active"),
        ]);

      const rows: UserRow[] = [];

      if (employeesResult.status === "fulfilled") {
        const all = employeesResult.value;
        setStats((prev) => ({
          ...prev,
          activeEmployees: all.filter((e) => e.active).length,
          inactiveEmployees: all.filter((e) => !e.active).length,
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
        const resolved: StudentRecord[] = Array.isArray(studentsResult.value)
          ? studentsResult.value
          : Array.isArray((studentsResult.value as { data?: StudentRecord[] }).data)
            ? ((studentsResult.value as { data: StudentRecord[] }).data ?? [])
            : [];

        // pendingStudents = alunos com status PENDING (aguardando verificação de e-mail)
        const pendingStudents = resolved.filter((s) => s.status === "PENDING");
        const activeStudents = resolved.filter((s) => s.status === "ACTIVE" && s.active);

        setStats((prev) => ({
          ...prev,
          activeStudents: activeStudents.length,
          pendingStudents: pendingStudents.length,
        }));

        for (const stu of resolved) {
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

  const filtered = userRows
    .filter((r) => filter === "Todos" || r.type === filter)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.identifier.toLowerCase().includes(q);
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
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
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">
                <Calendar className="w-4 h-4" />
                {monthLabel}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* ── Stat cards ───────────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <DashboardStatCard
              icon={GraduationCap}
              label="Alunos ativos"
              value={stats.activeStudents}
              href="/admin/students"
            />
            <DashboardStatCard
              icon={Users}
              label="Funcionários"
              value={stats.activeEmployees}
              href="/admin/employees"
            />
            <DashboardStatCard
              icon={ClipboardList}
              label="Solicitações pendentes"
              value={stats.pendingStudents}
              href="/admin/cards"
            />
            <DashboardStatCard
              icon={Bus}
              label="Frota em operação"
              value={stats.fleetLabel ?? "—"}
              href="/admin/buses"
            />
          </div>

          {/* ── Users table ──────────────────────────────────── */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden">

            <div className="px-6 py-3.5 border-b border-outline-variant/30 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-bold text-on-surface text-sm">Usuários do sistema</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {filtered.length} de {userRows.length} registros · funcionários e alunos
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Buscar por nome ou identificador…"
                    className="h-8 pl-8 pr-3 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-64"
                  />
                  {search && (
                    <button
                      onClick={() => handleSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
                  {(["Todos", "Aluno", "Funcionário"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => handleFilterChange(f)}
                      className={[
                        "px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150",
                        filter === f
                          ? "bg-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface",
                      ].join(" ")}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Identificador</th>
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loadingTable
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>
                          {[32, 40, 20, 16, 20].map((w, j) => (
                            <td key={j} className="px-6 py-3">
                              <div className={`h-3 w-${w} bg-surface-container-high rounded animate-pulse ${j === 4 ? "ml-auto" : ""}`} />
                            </td>
                          ))}
                        </tr>
                      ))
                    : paginated.length === 0
                      ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                            Nenhum usuário encontrado.
                          </td>
                        </tr>
                      )
                      : paginated.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                                  {getInitials(row.name)}
                                </div>
                                <span className="text-sm font-medium text-on-surface">{row.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm text-on-surface-variant">{row.identifier}</td>
                            <td className="px-6 py-3">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_STYLE[row.type]}`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[row.status]}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-xs text-on-surface-variant text-right">
                              {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                            </td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Exibindo {paginated.length} de {filtered.length} usuários</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                      page === i + 1
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant hover:bg-surface-container-low"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}