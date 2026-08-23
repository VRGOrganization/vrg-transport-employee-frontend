"use client";

import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { getInitials } from "@/lib/utils/string";

interface InfoModalShellProps {
  name: string;
  subtitle: string;
  open: boolean;
  onClose: () => void;
  size?: "md" | "lg" | "wide";
  children: ReactNode;
  /** "banner" (default): big gradient header with avatar + name. "slim": thin bar, just a close button — use when the content itself renders identity. */
  header?: "banner" | "slim";
}

export function InfoModalShell({ name, subtitle, open, onClose, size = "lg", children, header = "banner" }: InfoModalShellProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      hideClose
      noPadding
      closeOnBackdrop={false}
      header={
        header === "slim" ? (
          <div className="flex items-center justify-end px-4 pt-4 shrink-0">
            <button
              onClick={onClose}
              aria-label="Fechar modal"
              className="text-on-surface-variant hover:bg-surface-container-high size-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary to-primary-container px-6 py-8 flex flex-col items-center justify-center relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-on-primary hover:bg-black/20 size-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
            </button>
            <div className="size-24 rounded-full bg-surface flex items-center justify-center shadow-lg border-4 border-surface mb-4">
              <span className="text-3xl font-bold text-primary">{getInitials(name)}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-on-primary tracking-tight text-center">{name}</h2>
            <p className="text-on-primary/80 text-sm mt-1">{subtitle}</p>
          </div>
        )
      }
    >
      {children}
    </Modal>
  );
}
