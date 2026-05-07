import { useEffect, useState } from "react";
import { Student } from "@/types/student";
import { DAY_LABELS } from "@/types/cards.types";

interface StudentInfoModalProps {
  student: Student;
  onClose: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StudentInfoModal({ student, onClose }: StudentInfoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      {/* Background overlay to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl mx-4 bg-surface rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container px-6 py-8 flex flex-col items-center justify-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-on-primary hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>
          
          <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center shadow-lg border-4 border-surface mb-4">
            <span className="text-3xl font-bold text-primary">
              {getInitials(student.name)}
            </span>
          </div>
          
          <h2 className="text-2xl font-extrabold text-on-primary tracking-tight text-center">
            {student.name}
          </h2>
          <p className="text-on-primary/80 text-sm mt-1">
            {student.active ? "Estudante Ativo" : "Estudante Inativo"} no Sistema
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>mail</span>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">E-mail</p>
              </div>
              <p className="text-on-surface font-medium ml-8">{student.email}</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>phone</span>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Telefone</p>
              </div>
              <p className="text-on-surface font-medium ml-8">{student.telephone || "Não informado"}</p>
            </div>

            {/* Academic Info */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>account_balance</span>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Instituição</p>
              </div>
              <p className="text-on-surface font-medium ml-8">{student.institution || "Não informada"}</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>schedule</span>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Turno</p>
              </div>
              <p className="text-on-surface font-medium ml-8 capitalize">{student.shift || "Não informado"}</p>
            </div>
            
            {/* System Info */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm md:col-span-2 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>calendar_today</span>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Data de Cadastro</p>
                </div>
                <p className="text-on-surface font-medium ml-8">
                  {new Date(student.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "long", year: "numeric"
                  })}
                </p>
              </div>
              <div>
                 <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                    student.active 
                      ? "bg-success-container text-on-success" 
                      : "bg-error-container text-on-error"
                  }`}>
                    {student.active ? "Ativo" : "Inativo"}
                  </span>
              </div>
            </div>

            {/* Schedule Info */}
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

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all bg-surface-container-high hover:bg-surface-container-highest text-on-surface shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
