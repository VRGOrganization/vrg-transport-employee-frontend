"use client";

import { useState } from "react";
import { UserX, UserCheck, Loader2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { studentService } from "@/services/studentService";
import type { Student } from "@/types/student";

interface Props {
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

export function StudentModal({ student, onClose, onUpdated, onDeactivated, onReactivated }: Props) {
  const [data, setData] = useState<FormData>({
    name: student.name,
    telephone: student.telephone ?? "",
    institution: student.institution ?? "",
    shift: student.shift ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [view, setView] = useState<"form" | "delete-confirm" | "activate-confirm">("form");
  const [success, setSuccess] = useState(false);

  const handleCloseAfterSuccess = () => onUpdated(student);

  const onChange = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setGeneralError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim()) {
      setFieldErrors({ name: "Nome é obrigatório" });
      return;
    }
    setLoading(true);
    setGeneralError("");
    try {
      await studentService.update(student._id, {
        name: data.name.trim(),
        telephone: data.telephone.trim(),
        institution: data.institution,
        shift: data.shift,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGeneralError(error.message ?? "Erro ao atualizar estudante");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      if (student.active) {
        await studentService.deactivate(student._id);
        onDeactivated(student._id);
      } else {
        await studentService.reactivate(student._id);
        onReactivated({ ...student, active: true });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatusError(error.message ?? "Erro ao alterar status do estudante");
    } finally {
      setStatusLoading(false);
    }
  };

  if (view === "delete-confirm") {
    return (
      <ConfirmModal
        open
        onClose={() => { setStatusError(""); setView("form"); }}
        onConfirm={handleConfirmToggleStatus}
        loading={statusLoading}
        error={statusError}
        title="Desativar estudante?"
        icon={UserX}
        variant="danger"
        description={
          <>
            O estudante <strong>{student.name}</strong> perderá acesso ao sistema imediatamente.
            O cadastro poderá ser reativado posteriormente.
          </>
        }
        confirmLabel="Sim, desativar"
      />
    );
  }

  if (view === "activate-confirm") {
    return (
      <ConfirmModal
        open
        onClose={() => { setStatusError(""); setView("form"); }}
        onConfirm={handleConfirmToggleStatus}
        loading={statusLoading}
        error={statusError}
        title="Reativar estudante?"
        icon={UserCheck}
        variant="success"
        description={
          <>
            O estudante <strong>{student.name}</strong> recuperará acesso ao sistema imediatamente.
          </>
        }
        confirmLabel="Sim, reativar"
      />
    );
  }

  const inputClass = (hasError?: string) =>
    [
      "w-full h-10 px-3 rounded-lg bg-surface-container text-sm text-on-surface",
      "placeholder:text-on-surface-variant/50 outline-none transition-all focus:ring-2",
      hasError ? "ring-1 ring-error focus:ring-error" : "focus:ring-primary",
    ].join(" ");

  return (
    <Modal
      open
      onClose={success ? handleCloseAfterSuccess : onClose}
      title={success ? undefined : "Editar Estudante"}
      size="md"
    >
      {success ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
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
            onClick={handleCloseAfterSuccess}
            className="mt-2 px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Status row */}
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  student.active ? "bg-success" : "bg-surface-container-high"
                }`}
              />
              <span className="text-sm font-medium text-on-surface-variant">
                {student.active ? "Conta ativa" : "Conta desativada"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setView(student.active ? "delete-confirm" : "activate-confirm")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                student.active
                  ? "text-error hover:bg-error-container"
                  : "text-success hover:bg-success-container"
              }`}
            >
              {student.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              {student.active ? "Desativar" : "Reativar"}
            </button>
          </div>

          {generalError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-error-container/60 text-error text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {generalError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">
              Nome completo <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Nome do estudante"
              className={inputClass(fieldErrors.name)}
            />
            {fieldErrors.name && <p className="text-xs text-error">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">E-mail</label>
            <input
              type="email"
              value={student.email}
              disabled
              className="w-full h-10 px-3 rounded-lg bg-surface-container/50 text-sm text-on-surface-variant cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Telefone</label>
            <input
              type="tel"
              value={data.telephone}
              onChange={(e) => onChange("telephone", e.target.value)}
              placeholder="(00) 00000-0000"
              className={inputClass(fieldErrors.telephone)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Instituição</label>
            <input
              type="text"
              value={data.institution}
              onChange={(e) => onChange("institution", e.target.value)}
              placeholder="Nome da instituição"
              className={inputClass(fieldErrors.institution)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Turno</label>
            <select
              value={data.shift}
              onChange={(e) => onChange("shift", e.target.value)}
              className={inputClass(fieldErrors.shift)}
            >
              <option value="">Selecionar turno</option>
              <option value="morning">Manhã</option>
              <option value="afternoon">Tarde</option>
              <option value="evening">Noite</option>
              <option value="full">Integral</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
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
      )}
    </Modal>
  );
}
