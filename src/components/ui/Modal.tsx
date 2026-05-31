"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
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
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

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
        className={cn(
          "bg-surface-container-lowest rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto flex flex-col",
          SIZE_CLASSES[size],
        )}
      >
        {header}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            {title && (
              <h2 className="font-headline font-semibold text-lg text-on-surface flex-1">
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors ml-auto"
              >
                <X className="w-5 h-5" />
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
