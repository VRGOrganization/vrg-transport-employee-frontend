"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "wide";
  closeOnBackdrop?: boolean;
  hideClose?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  /** Full-width content rendered before the padded children area (e.g. gradient headers) */
  header?: ReactNode;
  /** Remove default px-6 pb-6 padding from the children wrapper */
  noPadding?: boolean;
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  // ~60% da largura da tela, com um piso mínimo para não espremer em telas estreitas.
  wide: "max-w-[min(60vw,72rem)] min-w-[min(60vw,40rem)]",
} as const;

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  closeOnBackdrop = false,
  hideClose = false,
  children,
  footer,
  header,
  noPadding = false,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // Respect an element that already grabbed focus on mount (e.g. autoFocus).
    if (!panelRef.current?.contains(document.activeElement)) {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? panelRef.current)?.focus();
    }
    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={
        closeOnBackdrop
          ? (e) => e.target === e.currentTarget && onClose()
          : undefined
      }
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "bg-surface-container-lowest rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto flex flex-col outline-none",
          SIZE_CLASSES[size],
        )}
      >
        {header}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            {title && (
              <h2 id={titleId} className="font-headline font-semibold text-lg text-on-surface flex-1">
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Fechar modal"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors ml-auto cursor-pointer"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        )}
        <div className={cn("flex-1", !noPadding && "px-6 pb-6")}>{children}</div>
        {footer && (
          <div className="px-6 pb-6 pt-2 border-t border-outline-variant/30 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
