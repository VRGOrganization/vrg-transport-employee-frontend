"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { EmployeeSideNav } from "@/components/layout/EmployeeSideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";

import { Student } from "@/types/student";
import { StudentCard, StudentCardSkeleton } from "@/components/students/StudentCard";
import { StudentListEmpty } from "@/components/students/StudentListEmpty";

type Tab = "active" | "inactive";
type StudentsResponse =
  | Student[]
  | {
      data?: Student[];
      total?: number;
      page?: number;
      limit?: number;
    };

export default function EmployeeStudentsPage() {
  const { user, logout } = useEmployeeAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("active");
  const [active, setActive] = useState<Student[]>([]);
  const [inactive, setInactive] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const resolveStudents = (payload: StudentsResponse): Student[] => {
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.data) ? payload.data : [];
  };

  const fetchActive = useCallback(async () => {
    const data = await employeeApi.get<StudentsResponse>('/student');
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
    loadTab("active");
  }, [loadTab]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    loadTab(t);
  };

  const handleEdit = (id: string) => {
    router.push(`/employee/students/edit?id=${id}`);
  };

  const displayed = tab === "active" ? active : inactive;
  const count = displayed.length;

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <EmployeeSideNav activePath="/employee/students" onLogout={logout} />

      <div className="min-w-0 flex flex-col">
        <TopBar user={user} />

        <main className="bg-surface p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/employee/dashboard"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                title="Voltar ao painel"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  arrow_back
                </span>
              </Link>
              <div className="flex-1">
                <h1 className="font-headline font-bold text-2xl text-on-surface">
                  Estudantes
                </h1>
                {!loading && !error && (
                  <p className="text-sm text-on-surface-variant">
                    {count} {count === 1 ? "estudante" : "estudantes"}{" "}
                    {tab === "active" ? "ativos" : "desativados"}
                  </p>
                )}
              </div>
              <Link href="/employee/students/new">
                <Button variant="primary" size="sm" icon="person_add">
                  Adicionar
                </Button>
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-container-high p-1 rounded-xl mb-5 w-fit">
              {(["active", "inactive"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {t === "active" ? "check_circle" : "person_off"}
                  </span>
                  {t === "active" ? "Ativos" : "Desativados"}
                </button>
              ))}
            </div>

            {/* Error state */}
            {error && (
              <StudentListEmpty tab={tab} isError onRetry={() => loadTab(tab)} />
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <StudentCardSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && displayed.length === 0 && (
              <StudentListEmpty tab={tab} />
            )}

            {/* Student list */}
            {!loading && !error && displayed.length > 0 && (
              <div className="flex flex-col gap-3">
                {displayed.map((student) => (
                  <StudentCard
                    key={student._id}
                    student={student}
                    onClick={() => handleEdit(student._id)}
                    onEdit={() => handleEdit(student._id)}
                  />
                ))}
              </div>
            )}

          </div>

          <div className="mt-auto w-full">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

