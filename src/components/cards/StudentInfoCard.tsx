import { BadgeCheck, CalendarDays } from "lucide-react";
import { resolveDisplayName, toTitleCase } from "@/lib/utils/string";
import { DAY_LABELS, type LicenseRecord, type StudentRecord } from "@/types/cards.types";

const DAY_ORDER = ["SEG", "TER", "QUA", "QUI", "SEX"] as const;

const PERIOD_STYLE: Record<string, string> = {
  "Manhã":    "bg-amber-50  text-amber-700  border-amber-200",
  "Tarde":    "bg-orange-50 text-orange-700 border-orange-200",
  "Noite":    "bg-violet-50 text-violet-700 border-violet-200",
  "Integral": "bg-teal-50   text-teal-700   border-teal-200",
};

type Schedule = NonNullable<StudentRecord["schedule"]>;

/** Grade SEG–SEX de uma matrícula (1ª ou 2ª faculdade). */
function ScheduleGrid({ schedule, title }: { schedule?: Schedule; title: string }) {
  return (
    <div className="border-t border-outline-variant/20 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="size-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {title}
        </h4>
      </div>
      {schedule && schedule.length > 0 ? (
        <div className="grid grid-cols-5 gap-2">
          {DAY_ORDER.map((day) => {
            const items = schedule.filter((s) => s.day === day);
            const active = items.length > 0;
            return (
              <div
                key={day}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-2 transition-all ${
                  active
                    ? "border-primary/20 bg-primary/5 shadow-sm"
                    : "border-outline-variant/15 bg-surface-container-low/40"
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold tracking-wider ${
                    active
                      ? "bg-primary text-on-primary shadow-md"
                      : "bg-surface-container-high text-on-surface-variant/35"
                  }`}
                >
                  {day}
                </div>
                <p
                  className={`text-[8px] font-bold uppercase leading-none tracking-widest ${
                    active ? "text-primary/60" : "text-on-surface-variant/30"
                  }`}
                >
                  {DAY_LABELS[day] ?? day}
                </p>
                <div className="mt-0.5 flex w-full flex-col gap-1">
                  {active ? (
                    items.map((item, i) => (
                      <span
                        key={i}
                        className={`w-full rounded-full border px-1 py-0.5 text-center text-[9px] font-semibold ${
                          PERIOD_STYLE[item.period] ??
                          "border-outline-variant bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {item.period}
                      </span>
                    ))
                  ) : (
                    <span className="text-center text-[11px] text-on-surface-variant/25">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-outline-variant/40 bg-surface-container-low p-4 text-center text-sm text-on-surface-variant">
          Sem grade cadastrada.
        </p>
      )}
    </div>
  );
}

interface StudentInfoCardProps {
  student: StudentRecord;
  currentLicense: LicenseRecord | null;
}

export function StudentInfoCard({ student, currentLicense }: StudentInfoCardProps) {
  // 2ª faculdade só aparece quando o aluno tem uma 2ª matrícula.
  const hasSecondary = Boolean(
    student.secondaryInstitution || student.secondaryUniversityId,
  );

  return (
    <div className="space-y-4 rounded-xl border border-outline-variant bg-surface px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-on-surface">{toTitleCase(resolveDisplayName(student))}</h2>
        {currentLicense ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success">
            <BadgeCheck className="size-3.5" />
            Carteirinha ativa
          </span>
        ) : (
          <span className="rounded-full bg-warning/20 px-2 py-1 text-xs font-semibold text-warning">
            Aguardando aprovação
          </span>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-on-surface">
          {hasSecondary ? "1ª faculdade" : "Dados do aluno"}
        </h3>
        <div className="grid grid-cols-1 gap-2 text-xs text-on-surface-variant md:grid-cols-2">
          <p>
            <strong className="text-on-surface">Curso:</strong> {student.degree ?? "-"}
          </p>
          <p>
            <strong className="text-on-surface">Turno:</strong> {student.shift ?? "-"}
          </p>
          <p className="md:col-span-2">
            <strong className="text-on-surface">Instituição:</strong>{" "}
            {student.institution ? toTitleCase(student.institution) : "-"}
          </p>
        </div>
      </div>

      <ScheduleGrid
        schedule={student.schedule}
        title={hasSecondary ? "Grade da 1ª faculdade" : "Grade informada"}
      />

      {hasSecondary && (
        <>
          <div className="border-t border-outline-variant/20 pt-4">
            <h3 className="mb-2 text-sm font-semibold text-on-surface">2ª faculdade</h3>
            <div className="grid grid-cols-1 gap-2 text-xs text-on-surface-variant md:grid-cols-2">
              <p>
                <strong className="text-on-surface">Curso:</strong>{" "}
                {student.secondaryDegree ?? "-"}
              </p>
              <p>
                <strong className="text-on-surface">Turno:</strong>{" "}
                {student.secondaryShift ?? "-"}
              </p>
              <p className="md:col-span-2">
                <strong className="text-on-surface">Instituição:</strong>{" "}
                {student.secondaryInstitution ? toTitleCase(student.secondaryInstitution) : "-"}
              </p>
            </div>
          </div>

          <ScheduleGrid
            schedule={student.secondarySchedule}
            title="Grade da 2ª faculdade"
          />
        </>
      )}
    </div>
  );
}
