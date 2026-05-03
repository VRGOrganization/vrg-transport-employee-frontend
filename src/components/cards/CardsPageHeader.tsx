import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface CardsPageHeaderProps {
  onRefresh: () => void;
  backHref?: string;
}

export function CardsPageHeader({ onRefresh, backHref = "/admin/dashboard" }: CardsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low p-2 text-on-surface-variant hover:bg-surface-container"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Gerenciar Carteirinhas
          </h1>
          <p className="text-sm text-on-surface-variant">
            Visualize documentos, revise informações e aprove emissões.
          </p>
        </div>
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