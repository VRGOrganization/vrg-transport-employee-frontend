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
import { StudentInfoModal } from "./info/StudentInfoModal";
import { StudentCardModal } from "./StudentCardModal";
import { AdminListTable, type TableColumn, type AdminTabItem } from "@/components/admin/AdminListTable";
import { buildStudentsCsv, downloadCsv } from "@/lib/csvUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "active" | "inactive";
type StudentsResponse =
  | Student[]
  | { data?: Student[]; total?: number; page?: number; limit?: number };

// ─── Helpers (module-level, no duplication cost) ──────────────────────────────

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

const TABS: AdminTabItem[] = [
  { key: "active", label: "Ativos", icon: "check_circle" },
  { key: "inactive", label: "Desativados", icon: "person_off" },
];

const NAME_SKELETON = (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
    <div className="h-3 w-32 bg-surface-container-high rounded animate-pulse" />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { user, logout } = useEmployeeAuth();

  const [tab, setTab] = useState<Tab>("active");
  const [active, setActive] = useState<Student[]>([]);
  const [inactive, setInactive] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [viewingCardStudent, setViewingCardStudent] = useState<Student | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

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

  useEffect(() => { loadTab("active"); }, [loadTab]);

  const handleTabChange = (t: string) => {
    setTab(t as Tab);
    loadTab(t as Tab);
  };

  /* ── Export ───────────────────────────────────────────────────────── */

  const handleExport = async () => {
    setExportLoading(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      const label = tab === "active" ? "ativos" : "desativados";
      downloadCsv(buildStudentsCsv(source), `alunos_${label}_${today}.csv`);
    } catch (err) {
      console.error("Erro ao exportar:", err);
    } finally {
      setExportLoading(false);
    }
  };

  /* ── Modal callbacks ──────────────────────────────────────────────── */

  const handleUpdated = () => { setSelected(null); loadTab(tab); };
  const handleDeactivated = () => { setSelected(null); loadTab(tab); };
  const handleReactivated = () => { setSelected(null); loadTab(tab); };

  /* ── Derived ──────────────────────────────────────────────────────── */

  const source = tab === "active" ? active : inactive;

  /* ── Column definitions ───────────────────────────────────────────── */

  const columns: TableColumn<Student>[] = [
    {
      key: "name",
      header: "Estudante",
      skeleton: NAME_SKELETON,
      render: (student, idx) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
            {getInitials(student.name)}
          </div>
          <span className="text-sm font-medium text-on-surface">{student.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "E-mail",
      render: (student) => (
        <span className="text-sm text-on-surface-variant">{student.email}</span>
      ),
    },
    {
      key: "institution",
      header: "Instituição",
      render: (student) => (
        <span className="text-sm text-on-surface-variant">{student.institution ?? "—"}</span>
      ),
    },
    {
      key: "shift",
      header: "Turno",
      render: (student) => (
        <span className="text-sm text-on-surface-variant">
          {student.shift ? shiftLabel[student.shift] ?? student.shift : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (student) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          student.active
            ? "bg-success-container text-on-success"
            : "bg-surface-container-high text-on-surface-variant"
        }`}>
          {student.active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Cadastro",
      align: "right",
      render: (student, _idx, isMounted) => (
        <span className="text-xs text-on-surface-variant">
          {isMounted ? new Date(student.createdAt).toLocaleDateString("pt-BR") : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ação",
      align: "right",
      render: (student) => (
        <div className="relative inline-block text-left">
          <button
            onClick={() => setOpenDropdownId(openDropdownId === student._id ? null : student._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors ml-auto"
            title="Ações"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>more_vert</span>
          </button>

          {openDropdownId === student._id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
              <div className="absolute right-0 mt-2 w-36 bg-surface-container-lowest rounded-lg shadow-xl border border-outline-variant/30 z-20 py-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => { setViewingStudent(student); setOpenDropdownId(null); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
                  Ver
                </button>
                <button
                  onClick={() => { setSelected(student); setOpenDropdownId(null); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                  Editar
                </button>
                <button
                  onClick={() => { setViewingCardStudent(student); setOpenDropdownId(null); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>badge</span>
                  Carteirinha
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

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
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Estudantes</h1>
              {!loading && !error && (
                <p className="text-sm text-on-surface-variant mt-1">
                  {source.length} {source.length === 1 ? "estudante" : "estudantes"}{" "}
                  {tab === "active" ? "ativos" : "desativados"}
                </p>
              )}
            </div>
            <Link href="/admin/students/new">
              <Button variant="primary" size="sm">Adicionar estudante</Button>
            </Link>
          </div>

          {/* Table */}
          <AdminListTable
            rows={source}
            rowKey={(s) => s._id}
            columns={columns}
            loading={loading}
            error={error}
            onRetry={() => loadTab(tab)}
            tabs={TABS}
            tab={tab}
            onTabChange={handleTabChange}
            onExport={handleExport}
            exportLoading={exportLoading}
            exportLabel={tab === "active" ? "Exportar Alunos" : "Exportar Desativados"}
            searchPlaceholder="Buscar por nome, e-mail ou instituição…"
            searchFields={(s) => [s.name, s.email, s.institution ?? ""]}
            renderEmpty={(t, hasSearch) => (
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                  {t === "active" ? "school" : "person_off"}
                </span>
                <p className="text-on-surface-variant text-sm">
                  {hasSearch
                    ? "Nenhum estudante encontrado para esta busca."
                    : t === "active"
                    ? "Nenhum estudante ativo."
                    : "Nenhum estudante desativado."}
                </p>
              </div>
            )}
          />
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

      {/* Info Modal */}
      {viewingStudent && (
        <StudentInfoModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
        />
      )}

      {/* Card Modal */}
      {viewingCardStudent && (
        <StudentCardModal
          student={viewingCardStudent}
          onClose={() => setViewingCardStudent(null)}
        />
      )}
    </div>
  );
}
