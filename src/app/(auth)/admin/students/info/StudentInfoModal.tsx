"use client";

import { useState } from "react";
import type { Student } from "@/types/student";
import { InfoModalShell } from "@/components/ui/InfoModalShell";
import { StudentInfoView } from "./StudentInfoView";
import { BanForm } from "./BanForm";

type View = "info" | "ban-form";

interface StudentInfoModalProps {
  student: Student;
  onClose: () => void;
  onBanned?: () => void;
}

export function StudentInfoModal({ student, onClose, onBanned }: StudentInfoModalProps) {
  const [view, setView] = useState<View>("info");

  const handleClose = view === "ban-form" ? () => setView("info") : onClose;

  return (
    <InfoModalShell
      name={student.name}
      subtitle={`${student.active ? "Estudante Ativo" : "Estudante Inativo"} no Sistema`}
      open
      onClose={handleClose}
    >
      {view === "info" && (
        <StudentInfoView
          student={student}
          onClose={onClose}
          onBan={() => setView("ban-form")}
        />
      )}
      {view === "ban-form" && (
        <BanForm
          student={student}
          onCancel={() => setView("info")}
          onBanned={() => onBanned?.()}
        />
      )}
    </InfoModalShell>
  );
}
