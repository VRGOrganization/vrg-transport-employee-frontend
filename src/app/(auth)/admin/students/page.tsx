"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";
import { Student } from "@/types/student";
import type { BanlistEntry } from "@/types/banlist";
import { StudentModal } from "./StdentModal";
import { StudentInfoModal } from "./info/StudentInfoModal";
import { StudentCardModal } from "./StudentCardModal";
import { UnbanModal } from "@/components/admin/UnbanModal";
import { AdminListTable, type TableColumn, type AdminTabItem } from "@/components/admin/AdminListTable";
import { buildStudentsCsv, downloadCsv } from "@/lib/csvUtils";
import { Pencil } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "active" | "inactive" | "banned";
type StudentsResponse =
  | Student[]
  | { data?: Student[]; total?: number; page?: number; limit?: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Tab definitions ──────────────────────────────────────────────────────────

const STUDENT_TABS: AdminTabItem[] = [
  { key: "active",   label: "Ativos",      icon: "check_circle" },
  { key: "inactive", label: "Desativados", icon: "person_off"   },
];

const ALL_TABS: AdminTabItem[] = [
  { key: "active",   label: "Ativos",      icon: "check_circle" },
  { key: "inactive", label: "Desativados", icon: "person_off"   },
  { key: "banned",   label: "Banidos",     icon: "block"        },
];

// ─── Skeletons ────────────────────────────────────────────────────────────────

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

  // Students data
  const [active, setActive] = useState<Student[]>([]);
  const [inactive, setInactive] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Banlist data
  const [banned, setBanned] = useState<BanlistEntry[]>([]);
  const [bannedLoading, setBannedLoading] = useState(false);
  const [bannedError, setBannedError] = useState("");
  const [unbanTarget, setUnbanTarget] = useState<BanlistEntry | null>(null);

  // Modals
  const [selected, setSelected] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [viewingCardStudent, setViewingCardStudent] = useState<Student | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  /* ── Data fetching ────────────────────────────────────────────────── */

  const resolveStudents = (payload: StudentsResponse): Student[] => {
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.data) ? payload.data : [];
  };

  const fetchActive = useCallback(async () => {
    const data = await employeeApi.get<StudentsResponse>("/student");
    setActive(resolveStudents(data));
  }, []);

  const fetchInactive = useCallback(async () => {
    const data = await employeeApi.get<StudentsResponse>("/student/inactive");
    setInactive(resolveStudents(data));
  }, []);

  const fetchBanned = useCallback(async () => {
    setBannedLoading(true);
    setBannedError("");
    try {
      const data = await employeeApi.get<BanlistEntry[]>("/banlist");
      setBanned(Array.isArray(data) ? data.filter((e) => e.active) : []);
    } catch {
      setBannedError("Não foi possível carregar os alunos banidos.");
    } finally {
      setBannedLoading(false);
    }
  }, []);

  const loadTab = useCallback(
    async (t: Tab) => {
      if (t === "banned") {
        await fetchBanned();
        return;
      }
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
    [fetchActive, fetchInactive, fetchBanned]
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
      downloadCsv(buildStudentsCsv(source as Student[]), `alunos_${label}_${today}.csv`);
    } catch (err) {
      console.error("Erro ao exportar:", err);
    } finally {
      setExportLoading(false);
    }
  };

  /* ── Modal callbacks ──────────────────────────────────────────────── */

  const handleUpdated    = () => { setSelected(null); loadTab(tab); };
  const handleDeactivated = () => { setSelected(null); loadTab(tab); };
  const handleReactivated = () => { setSelected(null); loadTab(tab); };
  const handleBanned      = () => {
    setViewingStudent(null);
    loadTab("active");
    fetchBanned();
  };

  /* ── Derived ──────────────────────────────────────────────────────── */

  const source: Student[] | BanlistEntry[] =
    tab === "active" ? active : tab === "inactive" ? inactive : banned;

  /* ── Student column definitions ───────────────────────────────────── */

  const studentColumns: TableColumn<Student>[] = [
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
        <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
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

  /* ── Banlist column definitions ───────────────────────────────────── */

  const banColumns: TableColumn<BanlistEntry>[] = [
    {
      key: "name",
      header: "Estudante",
      skeleton: NAME_SKELETON,
      render: (entry) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center text-error font-bold text-xs flex-shrink-0">
            {entry.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface">{entry.name}</p>
            <p className="text-xs text-on-surface-variant">{entry.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "reasons",
      header: "Motivos do Banimento",
      render: (entry) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {entry.reasons.slice(0, 2).map((r, i) => (
            <span
              key={i}
              className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-error/8 text-error border border-error/20 truncate max-w-[180px]"
              title={r}
            >
              {r}
            </span>
          ))}
          {entry.reasons.length > 2 && (
            <span className="text-[10px] text-on-surface-variant">+{entry.reasons.length - 2} mais</span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Data",
      render: (entry, _i, isMounted) => (
        <span className="text-sm text-on-surface-variant">
          {isMounted ? new Date(entry.createdAt).toLocaleDateString("pt-BR") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: () => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-error/10 text-error border border-error/20">
          Banido
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ação",
      align: "right",
      render: (entry) => (
        <button
          onClick={(e) => { e.stopPropagation(); setUnbanTarget(entry); }}
          title="Remover banimento"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-success hover:bg-success/10 transition-colors ml-auto"
        >
          <Pencil className="w-4 h-4" />
        </button>
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
              {!loading && !bannedLoading && !error && !bannedError && (
                <p className="text-sm text-on-surface-variant mt-1">
                  {tab !== "banned"
                    ? `${(source as Student[]).length} ${(source as Student[]).length === 1 ? "estudante" : "estudantes"} ${tab === "active" ? "ativos" : "desativados"}`
                    : `${(source as BanlistEntry[]).length} ${(source as BanlistEntry[]).length === 1 ? "aluno banido" : "alunos banidos"}`
                  }
                </p>
              )}
            </div>
            <Link href="/admin/students/new">
              <Button variant="primary" size="sm">Adicionar estudante</Button>
            </Link>
          </div>

          {/* ── Banned tab view ────────────────────────────────────── */}
          {tab === "banned" ? (
            <AdminListTable<BanlistEntry>
              rows={source as BanlistEntry[]}
              rowKey={(e) => e._id}
              columns={banColumns}
              loading={bannedLoading}
              error={bannedError}
              onRetry={fetchBanned}
              tabs={ALL_TABS}
              tab={tab}
              onTabChange={handleTabChange}
              searchPlaceholder="Buscar por nome ou e-mail…"
              searchFields={(e) => [e.name, e.email]}
              renderEmpty={(_t, hasSearch) => (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-4xl">block</span>
                  <p className="text-on-surface-variant text-sm">
                    {hasSearch
                      ? "Nenhum aluno banido encontrado para esta busca."
                      : "Nenhum aluno banido no momento."}
                  </p>
                </div>
              )}
            />
          ) : (
            /* ── Students tab view ──────────────────────────────── */
            <AdminListTable<Student>
              rows={source as Student[]}
              rowKey={(s) => s._id}
              columns={studentColumns}
              loading={loading}
              error={error}
              onRetry={() => loadTab(tab)}
              tabs={ALL_TABS}
              tab={tab}
              onTabChange={handleTabChange}
              onExport={tab !== "banned" ? handleExport : undefined}
              exportLoading={exportLoading}
              exportLabel={tab === "active" ? "Exportar Alunos" : "Exportar Desativados"}
              searchPlaceholder="Buscar por nome, e-mail ou instituição…"
              searchFields={(s) => [s.name, s.email, s.institution ?? ""]}
              onRowClick={(s) => setViewingStudent(s)}
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
          )}
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
          onEdit={() => { setSelected(viewingStudent); setViewingStudent(null); }}
          onBanned={handleBanned}
        />
      )}

      {/* Card Modal */}
      {viewingCardStudent && (
        <StudentCardModal
          student={viewingCardStudent}
          onClose={() => setViewingCardStudent(null)}
        />
      )}

      {/* Unban Modal */}
      {unbanTarget && (
        <UnbanModal
          open
          entry={unbanTarget}
          onClose={() => setUnbanTarget(null)}
          onSuccess={() => { setUnbanTarget(null); fetchBanned(); }}
        />
      )}
    </div>
  );
}
