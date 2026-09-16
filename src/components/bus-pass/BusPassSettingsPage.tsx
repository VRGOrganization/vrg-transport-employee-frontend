"use client";

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarRange, Minus, Plus, Ticket, Timer } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PanelCard } from "@/components/ui/PanelCard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { busPassService } from "@/services/busPassService";
import type { BusPassSettings, UpdateBusPassSettingsPayload } from "@/types/busPass";

interface StepperFieldProps {
  icon: LucideIcon;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function StepperField({
  icon: Icon,
  label,
  hint,
  value,
  min,
  max,
  suffix,
  onChange,
}: StepperFieldProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/60 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface">{label}</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">{hint}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 self-start rounded-lg border border-outline-variant bg-surface-container-lowest pl-1 sm:self-center">
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          className="flex size-8 items-center justify-center rounded-md text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="size-3.5" />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          className="w-14 bg-transparent text-center text-sm font-semibold text-on-surface outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          className="flex size-8 items-center justify-center rounded-md text-success transition-colors hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="size-3.5" />
        </button>
        {suffix && (
          <span className="pr-3 pl-1 text-xs text-on-surface-variant">{suffix}</span>
        )}
      </div>
    </div>
  );
}

/** Configurações do passe. Exclusiva do ADMIN. */
export function BusPassSettingsPage() {
  const [settings, setSettings] = useState<BusPassSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<BusPassSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loaded = await busPassService.getSettings();
      setSettings(loaded);
      setInitialSettings(loaded);
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          "Não foi possível carregar as configurações.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (changes: Partial<BusPassSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...changes } : prev));
  };

  const isDirty =
    !!settings &&
    !!initialSettings &&
    (settings.monthlyQuota !== initialSettings.monthlyQuota ||
      settings.minAdvanceHourBR !== initialSettings.minAdvanceHourBR ||
      settings.maxHorizonDays !== initialSettings.maxHorizonDays);

  const handleSave = async () => {
    if (!settings) return;

    // Só os campos que o admin de fato mudou — um PATCH parcial não deve
    // reafirmar o resto por cima de uma mudança concorrente de outro admin.
    const changes: UpdateBusPassSettingsPayload = {};
    if (!initialSettings || settings.monthlyQuota !== initialSettings.monthlyQuota) {
      changes.monthlyQuota = settings.monthlyQuota;
    }
    if (
      !initialSettings ||
      settings.minAdvanceHourBR !== initialSettings.minAdvanceHourBR
    ) {
      changes.minAdvanceHourBR = settings.minAdvanceHourBR;
    }
    if (!initialSettings || settings.maxHorizonDays !== initialSettings.maxHorizonDays) {
      changes.maxHorizonDays = settings.maxHorizonDays;
    }

    if (Object.keys(changes).length === 0) {
      toast.success("Nada para salvar.");
      return;
    }

    setSaving(true);
    try {
      // Patch otimista da tela com o retorno do servidor, padrão do repo.
      const updated = await busPassService.updateSettings(changes);
      setSettings(updated);
      setInitialSettings(updated);
      toast.success("Configurações salvas.");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ??
          "Não foi possível salvar as configurações.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="px-6 py-5 bg-surface">
        <div className="w-full max-w-2xl space-y-3" aria-busy="true">
          <div className="h-8 w-72 animate-pulse rounded bg-surface-container" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
        </div>
      </main>
    );
  }

  if (error || !settings) {
    return (
      <main className="px-6 py-5 bg-surface">
        <StatusBanner variant="error">{error ?? "Sem dados."}</StatusBanner>
      </main>
    );
  }

  return (
    <main className="px-6 py-5 bg-surface">
      <div className="w-full max-w-2xl space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-on-surface">
            Configurações do passe de ônibus
          </h1>
          <p className="text-sm text-on-surface-variant">
            Valem para todos os alunos. Alterações passam a valer nos próximos
            pedidos. Passes já aprovados não são afetados.
          </p>
        </header>

        <PanelCard className="space-y-3 p-4 sm:p-5">
          <StepperField
            icon={Ticket}
            label="Cota mensal por aluno"
            hint="Passes aprovados que um aluno pode ter por mês civil. 0 bloqueia novos pedidos."
            value={settings.monthlyQuota}
            min={0}
            max={31}
            onChange={(monthlyQuota) => patch({ monthlyQuota })}
          />

          <StepperField
            icon={Timer}
            label="Hora de corte (véspera)"
            hint="Até que hora de Brasília, no dia anterior, o aluno pode pedir, reenviar ou cancelar."
            value={settings.minAdvanceHourBR}
            min={0}
            max={23}
            suffix="h"
            onChange={(minAdvanceHourBR) => patch({ minAdvanceHourBR })}
          />

          <StepperField
            icon={CalendarRange}
            label="Horizonte"
            hint="Quantos dias corridos à frente o aluno pode escolher."
            value={settings.maxHorizonDays}
            min={1}
            max={60}
            suffix="dias"
            onChange={(maxHorizonDays) => patch({ maxHorizonDays })}
          />
        </PanelCard>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSave} disabled={saving || !isDirty} size="sm">
            {saving ? "Salvando…" : "Salvar"}
          </Button>
          <span className="text-xs text-on-surface-variant">
            {isDirty
              ? "Há alterações não salvas."
              : settings.updatedAt
                ? `Última alteração em ${new Date(settings.updatedAt).toLocaleString("pt-BR")}`
                : "Nenhuma alteração ainda."}
          </span>
        </div>
      </div>
    </main>
  );
}
