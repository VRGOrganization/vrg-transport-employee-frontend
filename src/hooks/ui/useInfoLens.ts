"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Bus, University } from "@/types/university.types";
import { DAY_LABELS } from "@/types/cards.types";
import type { InfoLens } from "@/types/info.types";
import {
  clearFilters,
  lensFromSearchParams,
  lensToSearchParams,
} from "@/lib/info/lens";
import { busLabel } from "@/lib/info/palette";

export interface LensChip {
  key: keyof InfoLens;
  label: string;
}

export interface UseInfoLensResult {
  lens: InfoLens;
  setLens: (next: InfoLens) => void;
  patchLens: (patch: Partial<InfoLens>) => void;
  clearLens: () => void;
  chips: LensChip[];
}

interface UseInfoLensOptions {
  universities: University[];
  buses: Bus[];
  /** Rótulos legíveis de curso, por chave normalizada. */
  courseLabels: Map<string, string>;
}

/**
 * A lente vive na URL: um recorte é um link. Copiar o endereço e abrir em outra
 * aba reproduz exatamente a mesma tela — requisito de prestação de contas.
 */
export function useInfoLens({
  universities,
  buses,
  courseLabels,
}: UseInfoLensOptions): UseInfoLensResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lens = useMemo(
    () => lensFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setLens = useCallback(
    (next: InfoLens) => {
      const params = lensToSearchParams(next);
      const query = params.toString();
      // `scroll: false`: trocar um filtro não pode jogar a página para o topo.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const patchLens = useCallback(
    (patch: Partial<InfoLens>) => setLens({ ...lens, ...patch }),
    [lens, setLens],
  );

  const clearLens = useCallback(
    () => setLens(clearFilters(lens)),
    [lens, setLens],
  );

  const chips = useMemo<LensChip[]>(() => {
    const out: LensChip[] = [];

    if (lens.universityId) {
      const uni = universities.find((u) => u._id === lens.universityId);
      out.push({
        key: "universityId",
        label: uni?.acronym || uni?.name || "Faculdade",
      });
    }
    if (lens.courseKey) {
      out.push({
        key: "courseKey",
        label: courseLabels.get(lens.courseKey) ?? "Curso",
      });
    }
    if (lens.busId) {
      const bus = buses.find((b) => b._id === lens.busId);
      out.push({ key: "busId", label: busLabel(bus?.identifier ?? "Ônibus") });
    }
    if (lens.shift) {
      out.push({ key: "shift", label: `Turno ${lens.shift}` });
    }
    if (lens.day) {
      out.push({ key: "day", label: DAY_LABELS[lens.day] ?? lens.day });
    }
    if (lens.period) {
      out.push({ key: "period", label: lens.period });
    }

    return out;
  }, [lens, universities, buses, courseLabels]);

  return { lens, setLens, patchLens, clearLens, chips };
}
