import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StickyFooterProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
}

export function StickyFooter({ children, className, gradient = false }: StickyFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 px-6 py-4",
        gradient
          ? "bg-gradient-to-t from-surface via-surface/90 to-transparent pt-8"
          : "bg-surface-container-lowest border-t border-outline-variant/30",
        className
      )}
    >
      {children}
    </div>
  );
}
