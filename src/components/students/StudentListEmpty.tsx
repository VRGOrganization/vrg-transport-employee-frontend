import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Tab = "active" | "inactive";

interface StudentListEmptyProps {
  tab: Tab;
  onRetry?: () => void;
  isError?: boolean;
}

export function StudentListEmpty({ tab, onRetry, isError }: StudentListEmptyProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="material-symbols-outlined text-error" style={{ fontSize: "40px" }}>
          error
        </span>
        <p className="text-on-surface-variant">Não foi possível carregar os estudantes</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="p-5 bg-surface-container-high rounded-full">
        <span
          className="material-symbols-outlined text-on-surface-variant"
          style={{ fontSize: "36px" }}
        >
          {tab === "active" ? "school" : "person_off"}
        </span>
      </div>
      <div>
        <p className="font-semibold text-on-surface">
          {tab === "active" ? "Nenhum estudante ativo" : "Nenhum estudante desativado"}
        </p>
        <p className="text-sm text-on-surface-variant mt-1">
          {tab === "active"
            ? "Adicione o primeiro estudante ao sistema"
            : "Estudantes desativados aparecerão aqui"}
        </p>
      </div>
      {tab === "active" && (
        <Link href="/admin/students/new">
          <Button variant="primary" size="sm" icon="person_add">
            Adicionar estudante
          </Button>
        </Link>
      )}
    </div>
  );
}