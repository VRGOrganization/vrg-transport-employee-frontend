import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PanelCardProps {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}

export function PanelCard({ className, children, as: Tag = "div" }: PanelCardProps) {
  return (
    <Tag className={cn("rounded-2xl border border-outline-variant bg-surface-container-lowest p-4", className)}>
      {children}
    </Tag>
  );
}
