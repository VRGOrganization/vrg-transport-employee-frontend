import Link from "next/link";
import { AlertCircle, GraduationCap, UserX, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResultState } from "@/components/ui/ResultState";

type Tab = "active" | "inactive";

interface StudentListEmptyProps {
  tab: Tab;
  onRetry?: () => void;
  isError?: boolean;
}

export function StudentListEmpty({ tab, onRetry, isError }: StudentListEmptyProps) {
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
        actions={isActive ? (
          <Link href="/admin/students/new">
            <Button variant="primary" size="sm" icon={<UserPlus className="size-4" />}>
              Adicionar estudante
            </Button>
          </Link>
        ) : undefined}
      />
    </div>
  );
}
