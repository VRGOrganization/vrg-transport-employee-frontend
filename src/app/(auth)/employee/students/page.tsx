"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { studentService } from "@/services/studentService";
import { Student } from "@/types/student";
import { StudentCard, StudentCardSkeleton } from "@/components/students/StudentCard";
import { StudentListEmpty } from "@/components/students/StudentListEmpty";

type Tab = "active" | "inactive";

export default function EmployeeStudentsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("active");
  const [active, setActive] = useState<Student[]>([]);
  const [inactive, setInactive] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActive = useCallback(async () => {
    setActive(await studentService.list());
  }, []);

  const fetchInactive = useCallback(async () => {
    setInactive(await studentService.listInactive());
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
    <main className="bg-surface p-8 min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="w-full">

            <PageHeader
              title="Estudantes"
              subtitle={!loading && !error ? `${count} ${count === 1 ? "estudante" : "estudantes"} ${tab === "active" ? "ativos" : "desativados"}` : undefined}
              back="/employee/dashboard"
              rightSlot={
                <Link href="/employee/students/new">
                  <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />}>Adicionar</Button>
                </Link>
              }
            />

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
                  <span className="material-symbols-outlined text-base">
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
  );
}
