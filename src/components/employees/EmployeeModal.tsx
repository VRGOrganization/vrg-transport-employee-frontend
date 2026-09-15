"use client";

import { useState } from "react";
import { UserX, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { InfoModalShell } from "@/components/ui/InfoModalShell";
import { toast } from "@/lib/toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { employeeService } from "@/services/employeeService";
import type { Employee } from "@/types/employee";
import { EmployeeInfoView } from "./EmployeeInfoView";
import { EmployeeEditForm } from "./EmployeeEditForm";
import { EmployeeEditConfirmView } from "./EmployeeEditConfirmView";
import { EmployeeDeleteForm } from "./EmployeeDeleteForm";
import type { ChangeEntry } from "./EmployeeEditForm";

type View =
  | "info"
  | "edit"
  | "edit-confirm"
  | "delete-confirm"
  | "activate-confirm"
  | "permanent-delete";

interface Props {
  employee: Employee;
  onClose: () => void;
  onUpdated: (updated: Employee) => void;
  onDeleted: (id: string) => void;
  /** Permite excluir permanentemente (somente admin). Default: true. */
  canDelete?: boolean;
}

export function EmployeeModal({ employee, onClose, onUpdated, onDeleted, canDelete = true }: Props) {
  const [view, setView] = useState<View>("edit");
  const [pendingPayload, setPendingPayload] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrepareConfirm = (payload: Record<string, string>, changes: ChangeEntry[]) => {
    setPendingPayload(payload);
    setPendingChanges(changes);
    setView("edit-confirm");
  };

  const handleConfirmUpdate = async () => {
    setLoading(true);
    setError("");
    try {
      const updated = await employeeService.update(employee._id, pendingPayload);
      toast.success("Informações do funcionário atualizadas com sucesso.");
      onUpdated(updated);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao atualizar funcionário");
      setView("edit");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await employeeService.deactivate(employee._id);
      toast.success("Funcionário desativado com sucesso.");
      onDeleted(employee._id);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao desativar funcionário");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmActivate = async () => {
    setLoading(true);
    setError("");
    try {
      const updated = await employeeService.reactivate(employee._id);
      toast.success("Funcionário reativado com sucesso.");
      onUpdated(updated);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao reativar funcionário");
    } finally {
      setLoading(false);
    }
  };

  if (view === "permanent-delete") {
    return (
      <InfoModalShell
        name={employee.name}
        subtitle="Exclusão permanente do cadastro"
        open
        onClose={() => setView("info")}
      >
        <EmployeeDeleteForm
          employee={employee}
          onCancel={() => setView("info")}
          onDeleted={() => onDeleted(employee._id)}
        />
      </InfoModalShell>
    );
  }

  if (view === "delete-confirm") {
    return (
      <ConfirmModal
        open
        onClose={() => { setError(""); setView("info"); }}
        onConfirm={handleConfirmDelete}
        loading={loading}
        error={error}
        title="Desativar funcionário?"
        icon={UserX}
        variant="danger"
        description={
          <>
            O funcionário <strong className="capitalize">{employee.name}</strong> perderá acesso ao sistema imediatamente.
            O cadastro poderá ser reativado posteriormente.
          </>
        }
        confirmLabel="Desativar"
      />
    );
  }

  if (view === "activate-confirm") {
    return (
      <ConfirmModal
        open
        onClose={() => { setError(""); setView("info"); }}
        onConfirm={handleConfirmActivate}
        loading={loading}
        error={error}
        title="Reativar funcionário?"
        icon={CheckCircle2}
        variant="success"
        description={
          <>
            O funcionário <strong className="capitalize">{employee.name}</strong> recuperará acesso ao sistema imediatamente.
          </>
        }
        confirmLabel="Reativar"
      />
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={view === "info" ? "Informações do Funcionário" : undefined}
      size="md"
    >
      {view === "info" && (
        <EmployeeInfoView
          employee={employee}
          onEdit={() => setView("edit")}
          onRequestDelete={() => setView("delete-confirm")}
          onRequestActivate={() => setView("activate-confirm")}
          onRequestPermanentDelete={
            canDelete && !employee.active ? () => setView("permanent-delete") : undefined
          }
        />
      )}
      {view === "edit" && (
        <EmployeeEditForm
          employee={employee}
          generalError={error}
          onCancel={() => { setError(""); onClose(); }}
          onPrepareConfirm={handlePrepareConfirm}
        />
      )}
      {view === "edit-confirm" && (
        <EmployeeEditConfirmView
          changes={pendingChanges}
          loading={loading}
          onBack={() => setView("edit")}
          onConfirm={handleConfirmUpdate}
        />
      )}
    </Modal>
  );
}
