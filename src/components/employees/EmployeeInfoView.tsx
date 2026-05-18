"use client";

import { Mail, Badge, Calendar, RefreshCw, Info, UserX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatDateLongBR } from "@/lib/utils/date";
import type { Employee } from "@/types/employee";

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-outline-variant last:border-0">
      <Icon className="w-4.5 h-4.5 text-on-surface-variant shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm font-medium text-on-surface truncate">{value}</p>
      </div>
    </div>
  );
}

interface Props {
  employee: Employee;
  onEdit: () => void;
  onRequestDelete: () => void;
  onRequestActivate: () => void;
}

export function EmployeeInfoView({ employee, onEdit, onRequestDelete, onRequestActivate }: Props) {
  return (
    <>
      <div className="flex items-center gap-4 mb-5">
        <Avatar name={employee.name} size="lg" />
        <div>
          <p className="font-semibold text-on-surface text-base">{employee.name}</p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              employee.active ? "bg-success/10 text-success" : "bg-error/10 text-error"
            }`}
          >
            {employee.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant px-4 mb-5">
        <InfoRow icon={Mail} label="Email" value={employee.email} />
        <InfoRow icon={Badge} label="Matrícula" value={employee.registrationId} />
        <InfoRow icon={Calendar} label="Cadastrado em" value={formatDateLongBR(employee.createdAt)} />
        <InfoRow icon={RefreshCw} label="Atualizado em" value={formatDateLongBR(employee.updatedAt)} />
      </div>

      {employee.active ? (
        <div className="flex gap-3">
          <Button variant="outline" size="sm" fullWidth icon="edit" onClick={onEdit}>
            Editar
          </Button>
          <button
            onClick={onRequestDelete}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full border-2 border-error text-error hover:bg-error/10 transition-colors"
          >
            <UserX className="w-4 h-4" />
            Desativar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 justify-center text-sm text-on-surface-variant bg-surface-container-high rounded-xl py-3">
            <Info className="w-4 h-4" />
            Este funcionário está desativado
          </div>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            className="bg-success hover:bg-success/90 border-none text-white"
            icon="check"
            onClick={onRequestActivate}
          >
            Reativar Funcionário
          </Button>
        </div>
      )}
    </>
  );
}
