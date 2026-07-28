"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/toast";
import { studentService } from "@/services/studentService";
import { universityService } from "@/services/universityService";
import type { Student } from "@/types/student";
import type { University } from "@/types/university.types";
import { StudentEditForm } from "./StudentEditForm";
import { StudentEditConfirmView, type ChangeEntry } from "./StudentEditConfirmView";

type View = "edit" | "confirm";

interface Props {
  student: Student;
  onClose: () => void;
  onUpdated: (updated: Student) => void;
}

export function StudentEditModal({ student, onClose, onUpdated }: Props) {
  const [view, setView] = useState<View>("edit");
  const [pendingPayload, setPendingPayload] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  useEffect(() => {
    setLoadingUniversities(true);
    universityService.list()
      .then(setUniversities)
      .catch(() => {})
      .finally(() => setLoadingUniversities(false));
  }, []);

  const handlePrepareConfirm = (payload: Record<string, string>, changes: ChangeEntry[]) => {
    setPendingPayload(payload);
    setPendingChanges(changes);
    setView("confirm");
  };

  const handleConfirmUpdate = async () => {
    setLoading(true);
    setError("");
    try {
      const updated = await studentService.update(student._id, pendingPayload);
      toast.success("Informações do estudante atualizadas com sucesso.");
      onUpdated(updated);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao atualizar estudante");
      setView("edit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="md">
      {view === "edit" && (
        <StudentEditForm
          student={student}
          universities={universities}
          loadingUniversities={loadingUniversities}
          generalError={error}
          onCancel={() => { setError(""); onClose(); }}
          onPrepareConfirm={handlePrepareConfirm}
        />
      )}
      {view === "confirm" && (
        <StudentEditConfirmView
          changes={pendingChanges}
          loading={loading}
          onBack={() => setView("edit")}
          onConfirm={handleConfirmUpdate}
        />
      )}
    </Modal>
  );
}
