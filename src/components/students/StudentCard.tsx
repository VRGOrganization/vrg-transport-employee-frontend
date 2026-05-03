import { Student } from "@/types/student";

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface StudentCardProps {
  student: Student;
  /** Clique na área principal do card (ex: abrir modal ou navegar) */
  onClick: () => void;
  /** Clique no botão de edição — redireciona para /admin/students/edit?id= */
  onEdit: () => void;
}

export function StudentCard({ student, onClick, onEdit }: StudentCardProps) {
  const isInactive = !student.active;

  return (
    <div
      className={`flex items-center gap-4 border rounded-2xl p-5 transition-all duration-200 ${
        isInactive
          ? "bg-surface-container-low border-outline-variant opacity-70 hover:opacity-100"
          : "bg-surface-container-lowest border-outline-variant hover:border-primary/30 hover:shadow-md"
      }`}
    >
      {/* Clickable area */}
      <button onClick={onClick} className="flex items-center gap-4 flex-1 min-w-0 text-left cursor-pointer">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center font-headline font-bold text-sm flex-shrink-0 ${
            isInactive ? "bg-outline-variant text-on-surface-variant" : "bg-primary text-white"
          }`}
        >
          {getInitials(student.name)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-on-surface truncate">{student.name}</p>
            {student.shift && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  student.shift === "diurno"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                }`}
              >
                {student.shift === "diurno" ? "Diurno" : "Noturno"}
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant truncate">{student.email}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {student.institution ?? "—"}
            {student.telephone ? ` · ${student.telephone}` : ""}
          </p>
        </div>
      </button>

      {/* Edit button — isolated so it doesn't trigger onClick */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        title="Editar estudante"
        className="flex-shrink-0 p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
          edit
        </span>
      </button>
    </div>
  );
}

export function StudentCardSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
      <div className="w-12 h-12 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-container-high rounded animate-pulse w-3/4" />
        <div className="h-3 bg-surface-container-high rounded animate-pulse w-1/2" />
        <div className="h-3 bg-surface-container-high rounded animate-pulse w-1/3" />
      </div>
      <div className="w-8 h-8 rounded-xl bg-surface-container-high animate-pulse flex-shrink-0" />
    </div>
  );
}