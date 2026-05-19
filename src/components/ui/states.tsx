import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";
import { ResultState } from "./ResultState";
import { Button } from "./Button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <ResultState
      variant="error"
      icon={AlertCircle}
      title="Erro ao carregar"
      description={message}
      size="sm"
      actions={
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )
      }
    />
  );
}

export function EmptyState({
  icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <ResultState
      variant="neutral"
      icon={icon}
      title={title}
      description={description}
      size="sm"
      actions={action}
    />
  );
}
