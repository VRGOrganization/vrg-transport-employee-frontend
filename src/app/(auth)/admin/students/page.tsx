"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";
import { Student } from "@/types/student";
import { StudentModal } from "./StdentModal";


type Tab = "active" | "inactive";
type StudentsResponse =
  | Student[]
  | { data?: Student[]; total?: number; page?: number; limit?: number };

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-rose-100 text-rose-700",
];

const shiftLabel: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  full: "Integral",
};

export default function StudentsPage() {
  const { user, logout } = useEmployeeAuth();

  const [tab, setTab] = useState<Tab>("active");
  const [active, setActive] = useState<Student[]>([]);
  const [inactive, setInactive] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [isMounted, setIsMounted] = useState(false);

  const resolveStudents = (payload: StudentsResponse): Student[] => {
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.data) ? payload.data : [];
  };

  const fetchActive = useCallback(async () => {
    const data = await employeeApi.get<StudentsResponse>("/student");
    setActive(resolveStudents(data));
  }, []);

  const fetchInactive = useCallback(async () => {
    const data = await employeeApi.get<Student[]>("/student/inactive");
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
        setError("Não foi possível carregar os estudantes");
      } finally {
        setLoading(false);
      }
    },
    [fetchActive, fetchInactive]
  );

  useEffect(() => {
    setIsMounted(true);
    loadTab("active");
  }, [loadTab]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSearch("");
    setPage(1);
    loadTab(t);
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handlePageSize = (s: (typeof PAGE_SIZE_OPTIONS)[number]) => {
    setPageSize(s);
    setPage(1);
  };

  /* ── Modal callbacks ──────────────────────────────────────────────── */

  const handleUpdated = (updated: Student) => {
    setSelected(null);
    loadTab(tab);
  };

  const handleDeactivated = (id: string) => {
    setSelected(null);
    loadTab(tab);
  };

  const handleReactivated = (updated: Student) => {
    setSelected(null);
    loadTab(tab);
  };

  /* ── Derived state ────────────────────────────────────────────────── */

  const source = tab === "active" ? active : inactive;

  const filtered = source.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.institution ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <div className="flex min-h-screen bg-surface">
      <SideNav activePath="/admin/students" onLogout={logout} />

      <div className="w-full flex flex-col min-h-screen">
        <TopBar user={user} />

        <main className="flex flex-col flex-1 bg-surface overflow-hidden">

          {/* Page header */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
                Estudantes
              </h1>
              {!loading && !error && (
                <p className="text-sm text-on-surface-variant mt-1">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "estudante" : "estudantes"}{" "}
                  {tab === "active" ? "ativos" : "desativados"}
                </p>
              )}
            </div>
            <Link href="/admin/students/new">
              <Button variant="primary" size="sm">
                Adicionar estudante
              </Button>
            </Link>
          </div>

          {/* Table section */}
          <section className="flex flex-col flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl mx-4 mb-4 overflow-hidden">

            {/* Toolbar */}
            <div className="px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap border-b border-outline-variant/20">

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
                {(["active", "inactive"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTabChange(t)}
                    className={[
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                      tab === t
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface",
                    ].join(" ")}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "14px" }}
                    >
                      {t === "active" ? "check_circle" : "person_off"}
                    </span>
                    {t === "active" ? "Ativos" : "Desativados"}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  style={{ fontSize: "16px" }}
                >
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou instituição…"
                  className="h-9 pl-9 pr-8 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary outline-none transition-all w-80"
                />
                {search && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "15px" }}
                    >
                      close
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="sticky top-0">
                  <tr className="bg-surface-container-low">
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Estudante
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      E-mail
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Instituição
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Turno
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">
                      Cadastro
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
                              <div className="h-3 w-32 bg-surface-container-high rounded animate-pulse" />
                            </div>
                          </td>
                          {[44, 28, 16, 16, 20, 8].map((w, j) => (
                            <td key={j} className="px-4 py-3.5">
                              <div
                                className={`h-3 w-${w} bg-surface-container-high rounded animate-pulse ${
                                  j >= 4 ? "ml-auto" : ""
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    : error
                    ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-error text-4xl">
                              error
                            </span>
                            <p className="text-on-surface-variant text-sm">{error}</p>
                            <button
                              onClick={() => loadTab(tab)}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              Tentar novamente
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                    : paginated.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                              {tab === "active" ? "school" : "person_off"}
                            </span>
                            <p className="text-on-surface-variant text-sm">
                              {search
                                ? "Nenhum estudante encontrado para esta busca."
                                : tab === "active"
                                ? "Nenhum estudante ativo."
                                : "Nenhum estudante desativado."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )
                    : paginated.map((student, idx) => (
                        <tr
                          key={student._id}
                          className="hover:bg-surface-container-low/40 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                  avatarColors[idx % avatarColors.length]
                                }`}
                              >
                                {getInitials(student.name)}
                              </div>
                              <span className="text-sm font-medium text-on-surface">
                                {student.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-on-surface-variant">
                            {student.email}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-on-surface-variant">
                            {student.institution ?? "—"}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-on-surface-variant">
                            {student.shift ? shiftLabel[student.shift] ?? student.shift : "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                student.active
                                  ? "bg-success-container text-on-success"
                                  : "bg-surface-container-high text-on-surface-variant"
                              }`}
                            >
                              {student.active ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-on-surface-variant text-right">
                            {isMounted 
                              ? new Date(student.createdAt).toLocaleDateString("pt-BR")
                              : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => setSelected(student)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors ml-auto"
                              title="Editar estudante"
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "18px" }}
                              >
                                edit
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4 py-3.5 border-t border-outline-variant/20 flex items-center justify-between text-sm text-on-surface-variant flex-shrink-0">

              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-xs">Linhas por página:</span>
                <div className="flex items-center gap-1">
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handlePageSize(s)}
                      className={[
                        "w-9 h-7 rounded-md text-xs font-semibold transition-all",
                        pageSize === s
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant hover:bg-surface-container-low",
                      ].join(" ")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page nav */}
              <div className="flex items-center gap-3">
                <span className="text-xs">
                  {filtered.length === 0
                    ? "0 de 0"
                    : `${(page - 1) * pageSize + 1}–${Math.min(
                        page * pageSize,
                        filtered.length
                      )} de ${filtered.length}`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={loading || page <= 1}
                    suppressHydrationWarning
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Primeira página"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      first_page
                    </span>
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={loading || page <= 1}
                    suppressHydrationWarning
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      chevron_left
                    </span>
                  </button>
                  <span className="text-xs px-2">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={loading || page >= totalPages}
                    suppressHydrationWarning
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      chevron_right
                    </span>
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={loading || page >= totalPages}
                    suppressHydrationWarning
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Última página"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      last_page
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Edit Modal */}
      {selected && (
        <StudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeactivated={handleDeactivated}
          onReactivated={handleReactivated}
        />
      )}
    </div>
  );
}