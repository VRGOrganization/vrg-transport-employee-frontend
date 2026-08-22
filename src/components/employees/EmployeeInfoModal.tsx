"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Employee } from "@/types/employee";
import { InfoModalShell } from "@/components/ui/InfoModalShell";
import { formatDateLongBR } from "@/lib/utils/date";
import { EmployeeDeleteForm } from "./EmployeeDeleteForm";

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  colSpan?: boolean;
  badge?: React.ReactNode;
}

function InfoRow({ icon, label, value, colSpan, badge }: InfoRowProps) {
  return (
    <div
      className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm ${
        colSpan ? "md:col-span-2 flex justify-between items-center" : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>{icon}</span>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-on-surface font-medium ml-8">{value}</p>
      </div>
      {badge}
    </div>
  );
}

type View = "info" | "delete-form";

interface EmployeeInfoModalProps {
  employee: Employee;
  onClose: () => void;
  onEdit?: () => void;
  /** Chamado após a exclusão permanente — a lista deve recarregar. */
  onDeleted?: () => void;
  /** Permite excluir permanentemente (somente admin). Default: true. */
  canDelete?: boolean;
}

export function EmployeeInfoModal({
  employee,
  onClose,
  onEdit,
  onDeleted,
  canDelete = true,
}: EmployeeInfoModalProps) {
  const [view, setView] = useState<View>("info");

  // Exclusão permanente só é oferecida para quem já está desativado — a
  // desativação é o passo reversível anterior (o backend também recusa).
  const showDeleteButton = canDelete && !employee.active;

  const handleClose = view === "delete-form" ? () => setView("info") : onClose;

  if (view === "delete-form") {
    return (
      <InfoModalShell
        name={employee.name}
        subtitle="Exclusão permanente do cadastro"
        open
        onClose={handleClose}
      >
        <EmployeeDeleteForm
          employee={employee}
          onCancel={() => setView("info")}
          onDeleted={() => onDeleted?.()}
        />
      </InfoModalShell>
    );
  }

  return (
    <InfoModalShell
      name={employee.name}
      subtitle={`${employee.active ? "Funcionário Ativo" : "Funcionário Inativo"} no Sistema`}
      open
      onClose={onClose}
    >
      <div className="p-8 overflow-y-auto flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow icon="mail" label="E-mail" value={employee.email} />
          <InfoRow icon="badge" label="Matrícula" value={employee.registrationId} />

          <InfoRow
            icon="calendar_today"
            label="Data de Cadastro"
            value={formatDateLongBR(employee.createdAt)}
            colSpan
            badge={
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm shrink-0 ${
                  employee.active
                    ? "bg-success-container text-on-success"
                    : "bg-error-container text-on-error"
                }`}
              >
                {employee.active ? "Ativo" : "Inativo"}
              </span>
            }
          />

          <InfoRow icon="update" label="Última Atualização" value={formatDateLongBR(employee.updatedAt)} />
        </div>
      </div>

      <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-end gap-3 shrink-0">
        {showDeleteButton && (
          <button
            onClick={() => setView("delete-form")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all border-2 border-error text-error hover:bg-error/10 mr-auto cursor-pointer"
          >
            <Trash2 className="size-4" />
            Remover Funcionário
          </button>
        )}
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all bg-surface-container-high hover:bg-surface-container-highest text-on-surface shadow-sm"
        >
          Fechar
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all bg-primary text-on-primary hover:opacity-90 shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
            Editar
          </button>
        )}
      </div>
    </InfoModalShell>
  );
}
