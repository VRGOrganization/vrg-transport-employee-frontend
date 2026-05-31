"use client";

import { Ban } from "lucide-react";
import type { Student } from "@/types/student";
import { DAY_LABELS } from "@/types/cards.types";

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  colSpan?: boolean;
  badge?: React.ReactNode;
}

function InfoRow({ icon, label, value, colSpan, badge }: InfoRowProps) {
  return (
    <div className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm ${colSpan ? "md:col-span-2 flex justify-between items-center" : ""}`}>
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

interface StudentInfoViewProps {
  student: Student;
  onClose: () => void;
  onEdit?: () => void;
  onBan?: () => void;
}

export function StudentInfoView({ student, onClose, onEdit, onBan }: StudentInfoViewProps) {
  return (
    <>
      <div className="p-8 overflow-y-auto flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow icon="mail" label="E-mail" value={student.email} />
          <InfoRow icon="phone" label="Telefone" value={student.telephone || "Não informado"} />
          <InfoRow icon="account_balance" label="Instituição" value={student.institution || "Não informada"} />
          <InfoRow icon="schedule" label="Turno" value={student.shift || "Não informado"} />

          <InfoRow
            icon="calendar_today"
            label="Data de Cadastro"
            value={new Date(student.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric",
            })}
            colSpan
            badge={
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                student.active
                  ? "bg-success-container text-on-success"
                  : "bg-error-container text-on-error"
              }`}>
                {student.active ? "Ativo" : "Inativo"}
              </span>
            }
          />

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm md:col-span-2 mt-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: "22px" }}>calendar_month</span>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Grade de Horários</p>
            </div>
            {student.schedule && student.schedule.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {student.schedule.map((item, index) => (
                  <span
                    key={`${item.day}-${item.period}-${index}`}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span>
                    {DAY_LABELS[item.day] ?? item.day} · {item.period}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant text-sm bg-surface-container-low p-4 rounded-lg text-center border border-dashed border-outline-variant/40">
                O estudante não cadastrou nenhuma grade de horários.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between gap-3 shrink-0">
        <div>
          {student.active && onBan && (
            <button
              onClick={onBan}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all text-error border border-error/30 hover:bg-error/8 hover:border-error/60"
            >
              <Ban className="w-4 h-4" />
              Banir
            </button>
          )}
        </div>
        <div className="flex gap-3">
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
      </div>
    </>
  );
}
