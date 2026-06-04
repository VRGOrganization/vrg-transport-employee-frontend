import { AlertCircle, GraduationCap, UserX, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResultState } from "@/components/ui/ResultState";

type Tab = "active" | "inactive";

interface StudentListEmptyProps {
  tab: Tab;
  onRetry?: () => void;
  isError?: boolean;
  onAdd?: () => void;
}

export function StudentListEmpty({ tab, onRetry, isError, onAdd }: StudentListEmptyProps) {
  if (isError) {
    return (
      <div className="py-16">
        <ResultState
          variant="error"
          icon={AlertCircle}
          title="Erro ao carregar estudantes"
          description="Não foi possível carregar os estudantes"
          size="sm"
          actions={onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : undefined}
        />
      </div>
    );
  }

  const isActive = tab === "active";

  return (
    <div className="py-16">
      <ResultState
        variant="neutral"
        icon={isActive ? GraduationCap : UserX}
        title={isActive ? "Nenhum estudante ativo" : "Nenhum estudante desativado"}
        description={
          isActive
            ? "Adicione o primeiro estudante ao sistema"
            : "Estudantes desativados aparecerão aqui"
        }
        size="sm"
        actions={isActive && onAdd ? (
          <Button variant="primary" size="sm" icon={<UserPlus className="size-4" />} onClick={onAdd}>
            Adicionar estudante
          </Button>
        ) : undefined}
      />
    </div>
  );
}
