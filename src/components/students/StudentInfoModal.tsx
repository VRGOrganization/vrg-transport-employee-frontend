"use client";

import { useState } from "react";
import type { Student } from "@/types/student";
import { resolveDisplayName } from "@/lib/utils/string";
import { InfoModalShell } from "@/components/ui/InfoModalShell";
import { StudentInfoView } from "./StudentInfoView";
import { BanForm } from "./BanForm";

type View = "info" | "ban-form";

interface StudentInfoModalProps {
  student: Student;
  onClose: () => void;
  onBanned?: () => void;
  /** Permite banir o estudante (somente admin). Default: true. */
  canBan?: boolean;
}

export function StudentInfoModal({ student, onClose, onBanned, canBan = true }: StudentInfoModalProps) {
  const [view, setView] = useState<View>("info");

  const handleClose = view === "ban-form" ? () => setView("info") : onClose;

  return (
    <InfoModalShell
      name={resolveDisplayName(student)}
      subtitle={`${student.active ? "Estudante Ativo" : "Estudante Inativo"} no Sistema`}
      open
      onClose={handleClose}
      size="wide"
      header={view === "info" ? "slim" : "banner"}
    >
      {view === "info" && (
        <StudentInfoView
          student={student}
          onClose={onClose}
          onBan={canBan ? () => setView("ban-form") : undefined}
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
