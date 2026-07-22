"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * true só depois da hidratação — evita createPortal/leitura de DOM antes do
 * client montar, sem o padrão setState-em-effect (useSyncExternalStore força
 * o re-render pós-hidratação sem precisar de setState síncrono no efeito).
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
