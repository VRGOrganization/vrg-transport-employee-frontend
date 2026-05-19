"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorPageContentProps {
  code?: string | number;
  title?: string;
  description?: string;
  onReset?: () => void;
  resetLabel?: string;
}

export function ErrorPageContent({
  code = "500",
  title = "Algo deu errado",
  description = "Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.",
  onReset,
  resetLabel = "Tentar novamente",
}: ErrorPageContentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-extrabold text-primary/20 mb-4">{code}</p>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">{title}</h1>
        <p className="text-sm text-on-surface-variant mb-8">{description}</p>
        {onReset && (
          <Button variant="outline" size="md" icon={<RefreshCw className="w-4 h-4" />} onClick={onReset}>
            {resetLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
