"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

type PageHeaderVariant = "default" | "skeleton";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  variant?: PageHeaderVariant;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  back,
  onBack,
  rightSlot,
  variant = "default",
  className,
}: PageHeaderProps) {
  const router = useRouter();

  if (variant === "skeleton") {
    return (
      <div className={cn("mb-6 flex items-center gap-3", className)}>
        <Skeleton rounded="rounded-lg" className="size-8 bg-surface-container-high" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40 bg-surface-container-high" />
          <Skeleton className="h-3 w-24 bg-surface-container-high" />
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    router.back();
  };

  return (
    <div className={cn("mb-6 flex items-center gap-3", className)}>
      {back && (
        typeof back === "string" ? (
          <Link
            href={back}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
        )
      )}

      <div className="flex-1 min-w-0">
        <h1 className="font-headline font-bold text-2xl text-on-surface leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-on-surface-variant mt-0.5">{subtitle}</p>
        )}
      </div>

      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
