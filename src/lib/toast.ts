export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  /** Auto-dismiss after ms. 0 = persistent until manually closed. */
  duration: number;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  const snapshot = [...items];
  listeners.forEach((fn) => fn(snapshot));
}

export const toastStore = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  getSnapshot(): ToastItem[] {
    return items;
  },

  add(item: Omit<ToastItem, "id">): string {
    const id = Math.random().toString(36).slice(2, 9);
    items = [...items, { ...item, id }];
    emit();

    if (item.duration > 0) {
      setTimeout(() => toastStore.remove(id), item.duration);
    }

    return id;
  },

  remove(id: string): void {
    items = items.filter((t) => t.id !== id);
    emit();
  },
};

/** Call from anywhere — no provider needed. */
export const toast = {
  success: (message: string, duration = 4000) =>
    toastStore.add({ variant: "success", message, duration }),

  error: (message: string, duration = 6000) =>
    toastStore.add({ variant: "error", message, duration }),

  warning: (message: string, duration = 5000) =>
    toastStore.add({ variant: "warning", message, duration }),

  info: (message: string, duration = 4000) =>
    toastStore.add({ variant: "info", message, duration }),
};
