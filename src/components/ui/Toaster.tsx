"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastStore, type ToastItem, type ToastVariant } from "@/lib/toast";
import { useHasMounted } from "@/hooks/useHasMounted";

const EMPTY_TOASTS: ToastItem[] = [];

const VARIANT_CONFIG: Record<
  ToastVariant,
  { border: string; icon: typeof AlertCircle; iconClass: string; bar: string }
> = {
  success: {
    border:    "border-success/40",
    icon:      CheckCircle2,
    iconClass: "text-success",
    bar:       "bg-success",
  },
  error: {
    border:    "border-error/40",
    icon:      AlertCircle,
    iconClass: "text-error",
    bar:       "bg-error",
  },
  warning: {
    border:    "border-warning/40",
    icon:      TriangleAlert,
    iconClass: "text-warning",
    bar:       "bg-warning",
  },
  info: {
    border:    "border-primary/40",
    icon:      Info,
    iconClass: "text-primary",
    bar:       "bg-primary",
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const [exiting, setExiting] = useState(false);
  const { border, icon: Icon, iconClass, bar } = VARIANT_CONFIG[item.variant];

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => toastStore.remove(item.id), 280);
  };

  // Trigger exit animation slightly before the store removes the item.
  useEffect(() => {
    if (item.duration <= 0) return;
    const t = setTimeout(() => setExiting(true), item.duration - 300);
    return () => clearTimeout(t);
  }, [item.duration]);

  return (
    <div
      className={cn(
        "relative flex w-80 items-start gap-3 overflow-hidden rounded-2xl border bg-surface-container-lowest px-4 py-3 shadow-xl shadow-black/10",
        border,
        exiting ? "animate-toast-out" : "animate-toast-in",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} />

      <p className="flex-1 text-sm font-medium leading-snug text-on-surface">
        {item.message}
      </p>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar notificação"
        className="cursor-pointer shrink-0 text-on-surface-variant opacity-50 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>

      {/* Progress bar */}
      {item.duration > 0 && (
        <div
          className={cn("absolute bottom-0 left-0 h-0.5 rounded-full", bar)}
          style={{ animation: `toast-progress ${item.duration}ms linear forwards` }}
        />
      )}
    </div>
  );
}

export function Toaster() {
  const mounted = useHasMounted();

  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    () => EMPTY_TOASTS,
  );

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-label="Notificações"
      className="pointer-events-none fixed bottom-6 right-6 z-[var(--z-toast)] flex flex-col-reverse gap-2"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard item={t} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
