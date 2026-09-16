"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { universityApi } from "@/lib/universityApi";
import { cn } from "@/lib/utils";
import type { Bus, University } from "@/types/university.types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";
import { FieldShell } from "@/components/ui/FieldShell";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useZodForm } from "@/components/hooks/useZodForm";
import { busFormSchema } from "@/lib/validation/bus";
import { UniversityComboboxField } from "./UniversityComboboxField";

type SlotDisplay = { universityId: string; name?: string; acronym?: string; priorityOrder: number; filledSlots?: number };

interface Props {
  open: boolean;
  initial?: Bus | null;
  onClose: () => void;
  onSubmit: (data: { identifier: string; capacity?: number | null; universitySlots?: Array<{ universityId: string; priorityOrder: number }>; shift?: string }) => Promise<void>;
}

const SHIFT_OPTIONS = [
  { value: "Manhã", label: "Manhã" },
  { value: "Tarde", label: "Tarde" },
  { value: "Noite", label: "Noite" },
];

function buildInitialSlots(initial?: Bus | null): SlotDisplay[] {
  if (initial?.universitySlots && initial.universitySlots.length > 0) {
    return initial.universitySlots.map((s) => ({
      universityId: typeof s.universityId === "string" ? s.universityId : s.universityId._id,
      acronym: typeof s.universityId === "string" ? undefined : s.universityId.acronym,
      name: typeof s.universityId === "string" ? undefined : s.universityId.name,
      priorityOrder: s.priorityOrder,
      filledSlots: s.filledSlots,
    }));
  }
  if ((initial?.universityIds ?? []).length > 0) {
    return (initial?.universityIds ?? []).map((u, idx) => ({
      universityId: typeof u === "string" ? u : u._id,
      name: typeof u === "string" ? undefined : u.name,
      acronym: typeof u === "string" ? undefined : u.acronym,
      priorityOrder: idx + 1,
    }));
  }
  return [];
}

export function BusFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [slots, setSlots] = useState<SlotDisplay[]>(() => buildInitialSlots(initial));
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const { values, errors, generalError, loading, setValue, resetGeneralError, handleSubmit } = useZodForm({
    schema: busFormSchema,
    initialValues: {
      identifier: initial?.identifier ?? "",
      capacity: initial?.capacity?.toString() ?? "",
      shift: initial?.shift ?? "",
    },
    onSubmit: async (data) => {
      const trimmedCapacity = data.capacity.trim();
      const parsedCapacity = trimmedCapacity.length > 0 ? parseInt(trimmedCapacity, 10) : undefined;

      if (
        parsedCapacity !== undefined &&
        initial?.filledSlotsTotal &&
        parsedCapacity < initial.filledSlotsTotal
      ) {
        return {
          success: false as const,
          error: `Capacidade não pode ficar abaixo da ocupação atual (${initial.filledSlotsTotal} alunos no pico da semana).`,
        };
      }

      const payload: Parameters<Props["onSubmit"]>[0] = {
        identifier: data.identifier,
        capacity: parsedCapacity ?? null,
      };
      if (slots.length > 0) {
        payload.universitySlots = slots.map((s) => ({ universityId: s.universityId, priorityOrder: s.priorityOrder }));
      }
      if (data.shift.length > 0) payload.shift = data.shift;

      try {
        await onSubmit(payload);
        onClose();
        return { success: true as const };
      } catch (err: unknown) {
        const error = err as { message?: string };
        return { success: false as const, error: error?.message ?? "Erro ao salvar." };
      }
    },
  });

  // Reseta o form a cada abertura sem efeito — mesmo padrão dos outros modais
  // deste app (comparação com prevOpen), evitando reidratar em todo render.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValue("identifier", initial?.identifier ?? "");
      setValue("capacity", initial?.capacity?.toString() ?? "");
      setValue("shift", initial?.shift ?? "");
      resetGeneralError();
      setSlots(buildInitialSlots(initial));
    }
  }

  useEffect(() => {
    if (!open) return;
    const mountState = { cancelled: false };
    setLoadingUniversities(true);
    (async () => {
      try {
        const list = await universityApi.list();
        if (mountState.cancelled) return;
        setUniversities(list);
        const map: Record<string, { acronym?: string; name?: string }> = {};
        list.forEach((u) => { map[u._id] = { acronym: u.acronym, name: u.name }; });
        setSlots((prev) =>
          prev.map((s) => ({
            ...s,
            acronym: s.acronym ?? map[s.universityId]?.acronym,
            name: s.name ?? map[s.universityId]?.name,
          }))
        );
      } catch {
        if (!mountState.cancelled) setUniversities([]);
      } finally {
        if (!mountState.cancelled) setLoadingUniversities(false);
      }
    })();
    return () => { mountState.cancelled = true; };
  }, [open]);

  const availableUniversities = universities.filter(
    (u) => !slots.some((s) => s.universityId === u._id)
  );

  const handleAddSlot = (university: University) => {
    setSlots((prev) => [
      ...prev,
      { universityId: university._id, name: university.name, acronym: university.acronym, priorityOrder: prev.length + 1 },
    ]);
  };

  const handleRemove = (universityId: string) => {
    setSlots((prev) => {
      const filtered = prev.filter((s) => s.universityId !== universityId);
      return filtered.map((s, idx) => ({ ...s, priorityOrder: idx + 1 }));
    });
  };

  const handleMove = (universityId: string, direction: "up" | "down") => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.universityId === universityId);
      if (idx === -1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = prev.slice();
      const tmp = next[swapIdx];
      next[swapIdx] = next[idx];
      next[idx] = tmp;
      return next.map((s, i) => ({ ...s, priorityOrder: i + 1 }));
    });
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title={initial ? "Editar Ônibus" : "Novo Ônibus"}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {generalError && <StatusBanner variant="error">{generalError}</StatusBanner>}

        <div>
          <Input
            label="Identificador"
            value={values.identifier}
            onChange={(e) => setValue("identifier", e.target.value.replace(/\D/g, "").slice(0, 2))}
            inputMode="numeric"
            pattern="\d{2}"
            maxLength={2}
            placeholder="Ex: 01"
            error={errors.identifier}
          />
          <p className="mt-1 text-xs text-on-surface-muted ml-1">
            Exatamente 2 dígitos numéricos, único entre os ônibus (ex: 01, 02).
          </p>
        </div>

        <div>
          <Input
            label="Capacidade de passageiros"
            type="number"
            min={1}
            value={values.capacity}
            onChange={(e) => setValue("capacity", e.target.value)}
            placeholder="Ex: 48"
            error={errors.capacity}
          />
          {!!initial?.filledSlotsTotal && initial.filledSlotsTotal > 0 && (
            <p className="mt-1 text-xs text-on-surface-muted ml-1">
              Ocupação atual (pico da semana): {initial.filledSlotsTotal}
            </p>
          )}
        </div>

        <SelectField
          label="Período principal do ônibus"
          options={SHIFT_OPTIONS}
          placeholder="Nenhum"
          value={values.shift}
          onChange={(e) => setValue("shift", e.target.value)}
          error={errors.shift}
        />

        <FieldShell label="Faculdades vinculadas">
          <div className="flex flex-col gap-2">
            {slots.length === 0 ? (
              <p className="text-xs text-on-surface-muted italic">Nenhuma faculdade vinculada</p>
            ) : (
              slots.map((s) => (
                <div key={s.universityId} className="flex items-center justify-between gap-3 py-1 px-2 rounded-lg border border-outline-variant">
                  <div className="text-sm">
                    <div className="font-medium text-on-surface">{s.acronym ?? s.name}</div>
                    <div className="text-xxs text-on-surface-muted">Prioridade P{s.priorityOrder}{s.filledSlots ? ` • ${s.filledSlots}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMove(s.universityId, "up")}
                      disabled={s.priorityOrder <= 1}
                      className={cn(
                        "p-1 rounded-md text-on-surface-variant hover:bg-surface-container-low",
                        s.priorityOrder <= 1 ? "opacity-40 cursor-not-allowed" : ""
                      )}
                      title="Mover para cima"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(s.universityId, "down")}
                      disabled={s.priorityOrder >= slots.length}
                      className={cn(
                        "p-1 rounded-md text-on-surface-variant hover:bg-surface-container-low",
                        s.priorityOrder >= slots.length ? "opacity-40 cursor-not-allowed" : ""
                      )}
                      title="Mover para baixo"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => handleRemove(s.universityId)} className="text-error text-sm">Remover</button>
                  </div>
                </div>
              ))
            )}
            <UniversityComboboxField
              universities={availableUniversities}
              loading={loadingUniversities}
              triggerLabel="Vincular faculdade"
              onSelect={handleAddSlot}
            />
          </div>
        </FieldShell>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" size="md" fullWidth onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
            {initial ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
