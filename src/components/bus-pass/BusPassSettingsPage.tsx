"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { toast } from "@/lib/toast";
import { busPassService } from "@/services/busPassService";
import type { BusPassSettings, UpdateBusPassSettingsPayload } from "@/types/busPass";

interface NumberFieldProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-32 rounded-lg border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
      />
      <span className="block text-xs text-on-surface-variant">{hint}</span>
    </label>
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
      <div className="space-y-3" aria-busy="true">
        <div className="h-8 w-56 animate-pulse rounded bg-surface-container" />
        <div className="h-48 animate-pulse rounded-xl bg-surface-container" />
      </div>
    );
  }

  if (error || !settings) {
    return <StatusBanner variant="error">{error ?? "Sem dados."}</StatusBanner>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-on-surface">
          Configurações do passe de ônibus
        </h1>
        <p className="text-sm text-on-surface-variant">
          Valem para todos os alunos. Alterações passam a valer nos próximos
          pedidos. Passes já aprovados não são afetados.
        </p>
      </header>

      <section className="space-y-5 rounded-xl border border-outline-variant bg-surface-container-low p-5">
        <NumberField
          label="Cota mensal por aluno"
          hint="Passes aprovados que um aluno pode ter por mês civil. 0 bloqueia novos pedidos."
          value={settings.monthlyQuota}
          min={0}
          max={31}
          onChange={(monthlyQuota) => patch({ monthlyQuota })}
        />

        <NumberField
          label="Hora de corte (véspera)"
          hint="Até que hora de Brasília, no dia anterior, o aluno pode pedir, reenviar ou cancelar."
          value={settings.minAdvanceHourBR}
          min={0}
          max={23}
          onChange={(minAdvanceHourBR) => patch({ minAdvanceHourBR })}
        />

        <NumberField
          label="Horizonte (dias)"
          hint="Quantos dias corridos à frente o aluno pode escolher."
          value={settings.maxHorizonDays}
          min={1}
          max={60}
          onChange={(maxHorizonDays) => patch({ maxHorizonDays })}
        />
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
        {settings.updatedAt ? (
          <span className="text-xs text-on-surface-variant">
            Última alteração em{" "}
            {new Date(settings.updatedAt).toLocaleString("pt-BR")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
