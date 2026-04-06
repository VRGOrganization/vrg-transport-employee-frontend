"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";

export interface Employee {
  _id: string;
  name: string;
  email: string;
  registrationId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  employee: Employee;
  onClose: () => void;
  onUpdated: (updated: Employee) => void;
  onDeleted: (id: string) => void;
}

type ModalView = "info" | "edit" | "edit-confirm" | "delete-confirm";

interface EditForm {
  name: string;
  email: string;
  registrationId: string;
  password: string;
  confirmPassword: string;
}

interface EditErrors {
  name: string;
  email: string;
  registrationId: string;
  password: string;
  confirmPassword: string;
  general: string;
}

interface ChangeEntry {
  label: string;
  from: string;
  to: string;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-outline-variant last:border-0">
      <span className="material-symbols-outlined text-on-surface-variant shrink-0" style={{ fontSize: "18px" }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm font-medium text-on-surface truncate">{value}</p>
      </div>
    </div>
  );
}

export function EmployeeModal({ employee, onClose, onUpdated, onDeleted }: Props) {
  const [view, setView] = useState<ModalView>("info");
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [formData, setFormData] = useState<EditForm>({
    name: employee.name,
    email: employee.email,
    registrationId: employee.registrationId,
    password: "",
    confirmPassword: "",
  });
  const emptyErrors: EditErrors = {
    name: "",
    email: "",
    registrationId: "",
    password: "",
    confirmPassword: "",
    general: "",
  };
  const [errors, setErrors] = useState<EditErrors>(emptyErrors);

  const [pendingChanges, setPendingChanges] = useState<ChangeEntry[]>([]);
  const [pendingPayload, setPendingPayload] = useState<Record<string, string>>({});

  const set = (field: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const next = { ...emptyErrors };
    let valid = true;

    if (!formData.name.trim()) {
      next.name = "Nome é obrigatório";
      valid = false;
    } else if (formData.name.trim().length > 100) {
      next.name = "Nome deve ter no máximo 100 caracteres";
      valid = false;
    }

    if (!formData.email.trim()) {
      next.email = "Email é obrigatório";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "Email inválido";
      valid = false;
    }

    if (!formData.registrationId.trim()) {
      next.registrationId = "Matrícula é obrigatória";
      valid = false;
    }

    if (formData.password) {
      if (!PASSWORD_REGEX.test(formData.password)) {
        next.password = "Mínimo 8 caracteres com maiúsculas, minúsculas e números";
        valid = false;
      } else if (!formData.confirmPassword) {
        next.confirmPassword = "Confirme a nova senha";
        valid = false;
      } else if (formData.password !== formData.confirmPassword) {
        next.confirmPassword = "As senhas não coincidem";
        valid = false;
      }
    }

    setErrors(next);
    return valid;
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, string> = {};
    const changes: ChangeEntry[] = [];

    if (formData.name.trim() !== employee.name) {
      payload.name = formData.name.trim();
      changes.push({ label: "Nome", from: employee.name, to: formData.name.trim() });
    }
    if (formData.email.trim().toLowerCase() !== employee.email) {
      payload.email = formData.email.trim().toLowerCase();
      changes.push({ label: "Email", from: employee.email, to: formData.email.trim().toLowerCase() });
    }
    if (formData.registrationId.trim() !== employee.registrationId) {
      payload.registrationId = formData.registrationId.trim();
      changes.push({ label: "Matrícula", from: employee.registrationId, to: formData.registrationId.trim() });
    }
    if (formData.password) {
      payload.password = formData.password;
      changes.push({ label: "Senha", from: "••••••••", to: "(nova senha definida)" });
    }

    if (changes.length === 0) {
      setErrors((prev) => ({ ...prev, general: "Nenhuma alteração foi feita" }));
      return;
    }

    setPendingChanges(changes);
    setPendingPayload(payload);
    setView("edit-confirm");
  };

  const handleConfirmUpdate = async () => {
    setLoading(true);
    try {
      const updated = await employeeApi.patch<Employee>(`/employee/${employee._id}`, pendingPayload);
      onUpdated(updated);
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      if (error.status === 409) {
        const msg = (error.message ?? "").toLowerCase();
        if (msg.includes("email")) {
          setErrors((prev) => ({ ...prev, email: "Este email já está em uso" }));
        } else {
          setErrors((prev) => ({ ...prev, registrationId: "Esta matrícula já está em uso" }));
        }
      } else {
        setErrors((prev) => ({ ...prev, general: error.message ?? "Erro ao atualizar" }));
      }
      setView("edit");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setDeleteError("");
    try {
      await employeeApi.delete(`/employee/${employee._id}`);
      onDeleted(employee._id);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setDeleteError(error.message ?? "Erro ao desativar funcionário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* ── INFO ── */}
        {view === "info" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="font-headline font-semibold text-lg text-on-surface">
                Informações do Funcionário
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div className="px-6 pb-2">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-headline font-bold text-xl shrink-0">
                  {getInitials(employee.name)}
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-base">{employee.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${employee.active ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                    {employee.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant px-4">
                <InfoRow icon="mail" label="Email" value={employee.email} />
                <InfoRow icon="badge" label="Matrícula" value={employee.registrationId} />
                <InfoRow icon="calendar_today" label="Cadastrado em" value={formatDate(employee.createdAt)} />
                <InfoRow icon="update" label="Atualizado em" value={formatDate(employee.updatedAt)} />
              </div>
            </div>

            {employee.active ? (
              <div className="flex gap-3 px-6 py-5">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon="edit"
                  onClick={() => setView("edit")}
                >
                  Editar
                </Button>
                <button
                  onClick={() => setView("delete-confirm")}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full border-2 border-error text-error hover:bg-error/10 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_off</span>
                  Desativar
                </button>
              </div>
            ) : (
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 justify-center text-sm text-on-surface-variant bg-surface-container-high rounded-xl py-3">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>info</span>
                  Este funcionário está desativado e não tem acesso ao sistema
                </div>
              </div>
            )}
          </>
        )}

        {/* ── EDIT ── */}
        {view === "edit" && (
          <>
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <button
                onClick={() => { setErrors(emptyErrors); setView("info"); }}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_back</span>
              </button>
              <h2 className="font-headline font-semibold text-lg text-on-surface flex-1">
                Editar Funcionário
              </h2>
            </div>

            <form onSubmit={handleEditSubmit} className="px-6 pb-6 space-y-4">
              {errors.general && (
                <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3">
                  {errors.general}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Nome completo
                </label>
                <Input type="text" icon="person" value={formData.name} onChange={set("name")} error={errors.name} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Email
                </label>
                <Input type="email" icon="mail" value={formData.email} onChange={set("email")} error={errors.email} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Matrícula
                </label>
                <Input type="text" icon="badge" value={formData.registrationId} onChange={set("registrationId")} error={errors.registrationId} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Nova senha <span className="normal-case font-normal">(opcional)</span>
                </label>
                <Input type="password" icon="lock" placeholder="Deixe em branco para não alterar" value={formData.password} onChange={set("password")} error={errors.password} />
              </div>

              {formData.password && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                    Confirmar nova senha
                  </label>
                  <Input type="password" icon="lock" placeholder="••••••••" value={formData.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" fullWidth onClick={() => { setErrors(emptyErrors); setView("info"); }}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" fullWidth icon="check">
                  Salvar alterações
                </Button>
              </div>
            </form>
          </>
        )}

        {/* ── EDIT CONFIRM ── */}
        {view === "edit-confirm" && (
          <>
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <button
                onClick={() => setView("edit")}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_back</span>
              </button>
              <h2 className="font-headline font-semibold text-lg text-on-surface flex-1">
                Confirmar alterações
              </h2>
            </div>

            <div className="px-6 pb-6">
              <p className="text-sm text-on-surface-variant mb-4">
                Revise as alterações antes de confirmar:
              </p>

              <div className="rounded-xl border border-outline-variant overflow-hidden mb-5">
                {pendingChanges.map((c, i) => (
                  <div key={i} className="px-4 py-3 border-b border-outline-variant last:border-0">
                    <p className="text-xs text-on-surface-variant font-medium mb-1">{c.label}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-error line-through">{c.from}</span>
                      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "14px" }}>arrow_forward</span>
                      <span className="text-success font-medium">{c.to}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" fullWidth onClick={() => setView("edit")}>
                  Voltar
                </Button>
                <Button variant="primary" size="sm" fullWidth loading={loading} icon="check" onClick={handleConfirmUpdate}>
                  Confirmar
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── DELETE CONFIRM ── */}
        {view === "delete-confirm" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="font-headline font-semibold text-lg text-on-surface">
                Desativar funcionário?
              </h2>
              <button
                onClick={() => setView("info")}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="flex flex-col items-center gap-3 py-4 text-center mb-5">
                <div className="p-4 bg-error/10 rounded-full">
                  <span className="material-symbols-outlined text-error" style={{ fontSize: "36px" }}>
                    person_off
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  O funcionário <span className="font-semibold text-on-surface">{employee.name}</span> perderá
                  acesso ao sistema imediatamente. O cadastro poderá ser reativado posteriormente.
                </p>
              </div>

              {deleteError && (
                <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-4">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" size="sm" fullWidth onClick={() => setView("info")}>
                  Cancelar
                </Button>
                <button
                  disabled={loading}
                  onClick={handleConfirmDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-error text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_off</span>
                  )}
                  Sim, desativar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
