"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ResultState } from "@/components/ui/ResultState";

interface SuccessBannerProps {
  title: string;
  description: string;
  backHref: string;
  backLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  resetIcon?: ReactNode;
}

export function SuccessBanner({
  title,
  description,
  backHref,
  backLabel = "Voltar",
  onReset,
  resetLabel = "Novo cadastro",
  resetIcon = <UserPlus className="size-4" />,
}: SuccessBannerProps) {
  const router = useRouter();

  return (
    <ResultState
      variant="success"
      icon={CheckCircle2}
      title={title}
      description={description}
      size="md"
      className="py-6"
      actions={
        <>
          <Button variant="outline" size="md" fullWidth icon={<ArrowLeft className="size-4" />} onClick={() => router.push(backHref)}>
            {backLabel}
          </Button>
          {onReset ? (
            <Button variant="primary" size="md" fullWidth icon={resetIcon} onClick={onReset}>
              {resetLabel}
            </Button>
          ) : null}
        </>
      }
    />
  );
}
