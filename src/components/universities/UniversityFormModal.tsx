"use client";

import { useState, useEffect } from "react";
import type { University, Course } from "@/types/university.types";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { courseApi } from "@/lib/universityApi";
import { BookOpen, RotateCcw, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  open: boolean;
  initial?: University | null;
  onClose: () => void;
  onSubmit: (data: { name: string; acronym: string; address: string }) => Promise<void>;
  onCoursesChanged?: () => void;
}

export function UniversityFormModal({ open, initial, onClose, onSubmit, onCoursesChanged }: Props) {
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Inactive courses section
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveCourses, setInactiveCourses] = useState<Course[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [reactivateError, setReactivateError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setAcronym(initial?.acronym ?? "");
      setAddress(initial?.address ?? "");
      setError("");
      setShowInactive(false);
      setInactiveCourses([]);
      setReactivateError("");
    }
  }, [open, initial]);

  const loadInactiveCourses = async () => {
    if (!initial?._id) return;
    setLoadingInactive(true);
    setReactivateError("");
    try {
      const data = await courseApi.listInactiveByUniversity(initial._id);
      setInactiveCourses(data);
    } catch {
      setReactivateError("Não foi possível carregar os cursos desativados.");
    } finally {
      setLoadingInactive(false);
    }
  };

  const handleToggleInactive = () => {
    if (!showInactive && inactiveCourses.length === 0) {
      void loadInactiveCourses();
    }
    setShowInactive((v) => !v);
  };

  const handleReactivate = async (courseId: string) => {
    setReactivatingId(courseId);
    setReactivateError("");
    try {
      await courseApi.reactivate(courseId);
      setInactiveCourses((prev) => prev.filter((c) => c._id !== courseId));
      onCoursesChanged?.();
    } catch {
      setReactivateError("Não foi possível reativar o curso. Tente novamente.");
    } finally {
      setReactivatingId(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !acronym.trim() || !address.trim()) {
      setError("Todos os campos são obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), acronym: acronym.trim(), address: address.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={initial ? "Editar Faculdade" : "Nova Faculdade"}
      actions={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth onClick={handleSubmit} loading={loading}>
            {initial ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Nome completo
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Universidade Federal Fluminense"
            className="w-full px-4 py-2.5 rounded-lg border border-on-surface-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Sigla
          </label>
          <input
            value={acronym}
            onChange={(e) => setAcronym(e.target.value.toUpperCase())}
            placeholder="Ex: UFF"
            maxLength={20}
            className="w-full px-4 py-2.5 rounded-lg border border-on-surface-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">
            Endereço
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Rua Miguel de Frias, 9 - Niterói"
            className="w-full px-4 py-2.5 rounded-lg border border-on-surface-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {error && <StatusBanner variant="error" className="mt-4">{error}</StatusBanner>}

      {/* Seção de cursos desativados — só ao editar */}
      {initial && (
        <div className="mt-5 border-t border-outline-variant pt-4">
          <button
            type="button"
            onClick={handleToggleInactive}
            className="flex items-center justify-between w-full text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span>Cursos desativados</span>
            {showInactive ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showInactive && (
            <div className="mt-3">
              {reactivateError && (
                <StatusBanner variant="error" className="mb-3">{reactivateError}</StatusBanner>
              )}

              {loadingInactive ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-on-surface-variant" />
                </div>
              ) : inactiveCourses.length === 0 ? (
                <p className="text-sm text-on-surface-muted text-center py-4">
                  Nenhum curso desativado
                </p>
              ) : (
                <ul className="space-y-2">
                  {inactiveCourses.map((course) => (
                    <li
                      key={course._id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookOpen className="size-4 text-on-surface-muted shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm text-on-surface-variant truncate block">{course.name}</span>
                          {course.model && (
                            <span className="text-xs text-on-surface-muted">{course.model}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleReactivate(course._id)}
                        disabled={reactivatingId === course._id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-success hover:bg-success/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0 ml-2"
                        title="Reativar curso"
                      >
                        {reactivatingId === course._id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <RotateCcw className="size-3.5" />
                        }
                        Reativar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
