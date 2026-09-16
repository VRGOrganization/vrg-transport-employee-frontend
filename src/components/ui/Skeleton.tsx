import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: string;
}

export function Skeleton({ className, rounded = "rounded" }: SkeletonProps) {
  return <div className={cn("bg-surface-container-low animate-pulse", rounded, className)} />;
}
