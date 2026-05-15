"use client";

import { useState, useEffect } from "react";
import { X, UserX, UserCheck, Loader2, AlertCircle } from "lucide-react";
import { employeeApi } from "@/lib/employeeApi";
import { Student } from "@/types/student";

interface StudentModalProps {
  student: Student;
  onClose: () => void;
  onUpdated: (updated: Student) => void;
  onDeactivated: (id: string) => void;
  onReactivated: (updated: Student) => void;
}

interface FormData {
  name: string;
  telephone: string;
  institution: string;
  shift: string;
}

interface FormErrors {
  name?: string;
  telephone?: string;
  institution?: string;
  shift?: string;
  general?: string;
}

export function StudentModal({
  student,
  onClose,
  onUpdated,
  onDeactivated,
  onReactivated,
}: StudentModalProps) {
  const [data, setData] = useState<FormData>({
    name: student.name,
    telephone: student.telephone ?? "",
    institution: student.institution ?? "",
    shift: student.shift ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [view, setView] = useState<"form" | "delete-confirm" | "activate-confirm">("form");
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    if (success) {
      onUpdated(student);
    } else {
      onClose();
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  const onChange = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!data.name.trim()) next.name = "Nome é obrigatório";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      const updated = await employeeApi.patch<Student>(`/student/${student._id}`, {
        name: data.name.trim(),
        telephone: data.telephone.trim(),
        institution: data.institution,
        shift: data.shift,
      });

      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrors({ general: error.message ?? "Erro ao atualizar estudante" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    setStatusLoading(true);
    try {
      const endpoint = student.active
        ? `/student/${student._id}/deactivate`
        : `/student/${student._id}/activate`;
      await employeeApi.patch(endpoint, {});

      if (student.active) {
        onDeactivated(student._id);
      } else {
        onReactivated({ ...student, active: true });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrors({ general: error.message ?? "Erro ao alterar status do estudante" });
      setView("form");
    } finally {
      setStatusLoading(false);
    }
  };

  const inputClass = (hasError?: string) =>
    [
      "w-full h-10 px-3 rounded-lg bg-surface-container text-sm text-on-surface",
      "placeholder:text-on-surface-variant/50 outline-none transition-all",
      "focus:ring-2",
      hasError
        ? "ring-1 ring-error focus:ring-error"
        : "focus:ring-primary",
    ].join(" ");

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">

        {/* Header */}
        {view === "form" && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <div>
              <h2 className="text-base font-bold text-on-surface">Editar Estudante</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{student.email}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form view */}
        {view === "form" && (
          success ? (
            <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-success-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-success text-2xl">check</span>
              </div>
              <div>
                <p className="font-semibold text-on-surface">Dados atualizados!</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  As informações de <span className="font-medium">{data.name}</span> foram salvas.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="mt-2 px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="px-6 py-5 space-y-4">

                {/* Status row */}
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${student.active ? "bg-success" : "bg-surface-container-high"
                        }`}
                    />
                    <span className="text-sm font-medium text-on-surface-variant">
                      {student.active ? "Conta ativa" : "Conta desativada"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setView(student.active ? "delete-confirm" : "activate-confirm")}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${student.active
                        ? "text-error hover:bg-error-container"
                        : "text-success hover:bg-success-container"
                      }`}
                  >
                    {student.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {student.active ? "Desativar" : "Reativar"}
                  </button>
                </div>

                {/* General error */}
                {errors.general && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-error-container/60 text-error text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errors.general}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Nome completo <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    placeholder="Nome do estudante"
                    className={inputClass(errors.name)}
                  />
                  {errors.name && (
                    <p className="text-xs text-error">{errors.name}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={student.email}
                    disabled
                    className="w-full h-10 px-3 rounded-lg bg-surface-container/50 text-sm text-on-surface-variant cursor-not-allowed"
                  />
                </div>

                {/* Telephone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={data.telephone}
                    onChange={(e) => onChange("telephone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={inputClass(errors.telephone)}
                  />
                </div>

                {/* Institution */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Instituição
                  </label>
                  <input
                    type="text"
                    value={data.institution}
                    onChange={(e) => onChange("institution", e.target.value)}
                    placeholder="Nome da instituição"
                    className={inputClass(errors.institution)}
                  />
                </div>

                {/* Shift */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Turno
                  </label>
                  <select
                    value={data.shift}
                    onChange={(e) => onChange("shift", e.target.value)}
                    className={inputClass(errors.shift)}
                  >
                    <option value="">Selecionar turno</option>
                    <option value="morning">Manhã</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noite</option>
                    <option value="full">Integral</option>
                  </select>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {loading ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          )
        )}
        {/* ── DELETE CONFIRM ── */}
        {view === "delete-confirm" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="font-headline font-semibold text-lg text-on-surface">
                Desativar estudante?
              </h2>
              <button
                onClick={() => setView("form")}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="flex flex-col items-center gap-3 py-4 text-center mb-5">
                <div className="p-4 bg-error/10 rounded-full">
                  <UserX className="w-9 h-9 text-error" />
                </div>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  O estudante <span className="font-semibold text-on-surface">{student.name}</span> perderá
                  acesso ao sistema imediatamente. O cadastro poderá ser reativado posteriormente.
                </p>
              </div>

              {errors.general && (
                <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-4">
                  {errors.general}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors"
                  onClick={() => setView("form")}
                >
                  Cancelar
                </button>
                <button
                  disabled={statusLoading}
                  onClick={handleConfirmToggleStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-error text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {statusLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <UserX className="w-4.5 h-4.5" />
                  )}
                  Sim, desativar
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── ACTIVATE CONFIRM ── */}
        {view === "activate-confirm" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="font-headline font-semibold text-lg text-on-surface">
                Reativar estudante?
              </h2>
              <button
                onClick={() => setView("form")}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="flex flex-col items-center gap-3 py-4 text-center mb-5">
                <div className="p-4 bg-success/10 rounded-full">
                  <UserCheck className="w-9 h-9 text-success" />
                </div>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  O estudante <span className="font-semibold text-on-surface">{student.name}</span> recuperará
                  acesso ao sistema imediatamente.
                </p>
              </div>

              {errors.general && (
                <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-4">
                  {errors.general}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors"
                  onClick={() => setView("form")}
                >
                  Cancelar
                </button>
                <button
                  disabled={statusLoading}
                  onClick={handleConfirmToggleStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-success text-white hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {statusLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-4.5 h-4.5" />
                  )}
                  Sim, reativar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}