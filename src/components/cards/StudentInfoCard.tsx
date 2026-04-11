import { BadgeCheck } from "lucide-react";
import { DAY_LABELS, type LicenseRecord, type StudentRecord } from "@/types/cards.types";

interface StudentInfoCardProps {
  student: StudentRecord;
  currentLicense: LicenseRecord | null;
}

export function StudentInfoCard({ student, currentLicense }: StudentInfoCardProps) {
  return (
    <div className="space-y-4 rounded-xl border border-outline-variant bg-surface px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-on-surface">{student.name}</h2>
        {currentLicense ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success">
            <BadgeCheck className="h-3.5 w-3.5" />
            Carteirinha ativa
          </span>
        ) : (
          <span className="rounded-full bg-warning/20 px-2 py-1 text-xs font-semibold text-warning">
            Aguardando aprovação
          </span>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-on-surface">Dados do aluno</h3>
        <div className="grid grid-cols-1 gap-2 text-xs text-on-surface-variant md:grid-cols-2">
          <p>
            <strong className="text-on-surface">Curso:</strong> {student.degree ?? "—"}
          </p>
          <p>
            <strong className="text-on-surface">Turno:</strong> {student.shift ?? "—"}
          </p>
          <p className="md:col-span-2">
            <strong className="text-on-surface">Instituição:</strong>{" "}
            {student.institution ?? "—"}
          </p>
        </div>
      </div>

      <div className="border-t border-outline-variant/20 pt-4">
        <h4 className="mb-2 text-sm font-semibold text-on-surface">Grade informada</h4>
        {student.schedule && student.schedule.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {student.schedule.map((item, index) => (
              <span
                key={`${item.day}-${item.period}-${index}`}
                className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
              >
                {DAY_LABELS[item.day] ?? item.day} · {item.period}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant">Sem grade cadastrada.</p>
        )}
      </div>
    </div>
  );
}