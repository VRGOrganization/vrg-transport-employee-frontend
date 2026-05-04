import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CardsPageHeaderProps {
  onRefresh: () => void;
}

export function CardsPageHeader({ onRefresh }: CardsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Gerenciar Carteirinhas
        </h1>
        <p className="text-sm text-on-surface-variant">
          Visualize documentos, revise informações e aprove emissões.
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        icon={<RefreshCw className="h-4 w-4" />}
      >
        Atualizar
      </Button>
    </div>
  );
}
