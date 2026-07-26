"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useModalA11y } from "@/hooks/ui/useModalA11y";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: LucideIcon;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  closeOnOverlay?: boolean;
  maxWidth?: string;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  icon: Icon,
  description,
  children,
  actions,
  closeOnOverlay = false,
  maxWidth = "max-w-md",
  className,
}: BottomSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(panelRef, onClose, open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeOnOverlay ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn("relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto outline-none", maxWidth, className)}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors z-10"
          aria-label="Fechar modal"
        >
          <X className="size-5" />
        </button>

        {(title || Icon) && (
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 pr-12">
            {Icon && (
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="size-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h2 id={titleId} className="font-headline font-semibold text-lg text-on-surface leading-tight">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-on-surface-variant mt-0.5">{description}</p>
              )}
            </div>
          </div>
        )}

        <div className="px-6 pb-6">{children}</div>

        {actions && <div className="px-6 pb-6 pt-0">{actions}</div>}
      </div>
    </div>
  );
}
