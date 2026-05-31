"use client";

import { useState } from "react";
import type { Student } from "@/types/student";
import { Modal } from "@/components/ui/Modal";
import { getInitials } from "@/lib/utils/string";
import { StudentInfoView } from "./StudentInfoView";
import { BanForm } from "./BanForm";

type View = "info" | "ban-form";

interface StudentInfoModalProps {
  student: Student;
  onClose: () => void;
  onEdit?: () => void;
  onBanned?: () => void;
}

export function StudentInfoModal({ student, onClose, onEdit, onBanned }: StudentInfoModalProps) {
  const [view, setView] = useState<View>("info");

  const handleBanned = () => {
    onBanned?.();
  };

  return (
    <Modal
      open
      onClose={view === "ban-form" ? () => setView("info") : onClose}
      size="lg"
      hideClose
      noPadding
      header={
        <div className="bg-gradient-to-r from-primary to-primary-container px-6 py-8 flex flex-col items-center justify-center relative shrink-0">
          <button
            onClick={view === "ban-form" ? () => setView("info") : onClose}
            className="absolute top-4 right-4 text-on-primary hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>
          <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center shadow-lg border-4 border-surface mb-4">
            <span className="text-3xl font-bold text-primary">{getInitials(student.name)}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-on-primary tracking-tight text-center">{student.name}</h2>
          <p className="text-on-primary/80 text-sm mt-1">
            {student.active ? "Estudante Ativo" : "Estudante Inativo"} no Sistema
          </p>
        </div>
      }
    >
      {view === "info" && (
        <StudentInfoView
          student={student}
          onClose={onClose}
          onEdit={onEdit}
          onBan={() => setView("ban-form")}
        />
      )}
      {view === "ban-form" && (
        <BanForm
          student={student}
          onCancel={() => setView("info")}
          onBanned={handleBanned}
        />
      )}
    </Modal>
  );
}
