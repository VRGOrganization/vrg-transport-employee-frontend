"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquareWarning, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldShell } from "@/components/ui/FieldShell";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { toast } from "@/lib/toast";
import { systemNoticeTemplateService } from "@/services/systemNoticeTemplateService";
import type {
  SystemNoticeTemplate,
  SystemNoticeTemplateKey,
} from "@/services/systemNoticeTemplateService";
import { sectorContactInfoService } from "@/services/sectorContactInfoService";

interface TemplateGroup {
  label: string;
  keys: SystemNoticeTemplateKey[];
}

const GROUPS: TemplateGroup[] = [
  { label: "Abertura de raia", keys: ["WINDOW_OPEN"] },
  { label: "Fechamento de raia", keys: ["WINDOW_CLOSE_7", "WINDOW_CLOSE_3", "WINDOW_CLOSE_1"] },
  { label: "Reset da piscina", keys: ["CYCLE_RESET_7", "CYCLE_RESET_3", "CYCLE_RESET_1"] },
];

const ITEM_SUFFIXES: Partial<Record<SystemNoticeTemplateKey, string>> = {
  WINDOW_CLOSE_7: "7 dias antes",
  WINDOW_CLOSE_3: "3 dias antes",
  WINDOW_CLOSE_1: "1 dia antes",
  CYCLE_RESET_7: "7 dias antes",
  CYCLE_RESET_3: "3 dias antes",
  CYCLE_RESET_1: "1 dia antes",
};

function itemLabel(groupLabel: string, key: SystemNoticeTemplateKey): string {
  const suffix = ITEM_SUFFIXES[key];
  return suffix ? `${groupLabel} — ${suffix}` : groupLabel;
}

type Draft = Record<SystemNoticeTemplateKey, { title: string; body: string }>;

function buildDraft(templates: SystemNoticeTemplate[]): Draft {
  const draft = {} as Draft;
  for (const t of templates) {
    draft[t.key] = { title: t.title, body: t.body };
  }
  return draft;
}

export function SystemNoticeTemplatesPage() {
  const [templates, setTemplates] = useState<SystemNoticeTemplate[]>([]);
  const [draft, setDraft] = useState<Draft>({} as Draft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState<SystemNoticeTemplateKey | null>(null);

  const [address, setAddress] = useState("");
  const [addressDraft, setAddressDraft] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await systemNoticeTemplateService.list();
      setTemplates(data);
      setDraft(buildDraft(data));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Não foi possível carregar os templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadAddress = async () => {
      try {
        const info = await sectorContactInfoService.get();
        setAddress(info.address);
        setAddressDraft(info.address);
      } catch {
        setAddress("");
        setAddressDraft("");
      }
    };
    void loadAddress();
  }, []);

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      const updated = await sectorContactInfoService.update(addressDraft);
      setAddress(updated.address);
      setAddressDraft(updated.address);
      toast.success("Endereço salvo com sucesso.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Erro ao salvar endereço.");
    } finally {
      setSavingAddress(false);
    }
  };

  const templateByKey = (key: SystemNoticeTemplateKey) =>
    templates.find((t) => t.key === key);

  const isDirty = (key: SystemNoticeTemplateKey) => {
    const original = templateByKey(key);
    const current = draft[key];
    if (!original || !current) return false;
    return original.title !== current.title || original.body !== current.body;
  };

  const handleFieldChange = (
    key: SystemNoticeTemplateKey,
    field: "title" | "body",
    value: string,
  ) => {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSave = async (key: SystemNoticeTemplateKey) => {
    const current = draft[key];
    if (!current) return;
    setSavingKey(key);
    try {
      const updated = await systemNoticeTemplateService.update(key, {
        title: current.title,
        body: current.body,
      });
      setTemplates((prev) => prev.map((t) => (t.key === key ? updated : t)));
      setDraft((prev) => ({ ...prev, [key]: { title: updated.title, body: updated.body } }));
      toast.success("Template salvo com sucesso.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Erro ao salvar template.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-8 min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Mensagens de sistema</h1>
        <p className="text-sm text-on-surface-muted mt-1">
          Edite o título e o corpo dos avisos automáticos enviados aos alunos. O
          texto salvo aqui é o que será usado no próximo disparo automático de
          cada evento.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-surface-container-low animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && !error && templates.length === 0 && (
        <EmptyState
          icon={MessageSquareWarning}
          title="Nenhum template de sistema encontrado"
          description="A API não retornou nenhum dos 7 templates esperados. Verifique se o seed de templates de sistema foi executado no ambiente."
        />
      )}

      {!loading && !error && templates.length > 0 && (
        <div className="flex flex-col gap-8">
          {GROUPS.map((group) => (
            <section key={group.label}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                {group.label}
              </h2>
              <div className="flex flex-col gap-4">
                {group.keys.map((key) => {
                  const current = draft[key];
                  if (!current) return null;
                  const dirty = isDirty(key);
                  const saving = savingKey === key;

                  return (
                    <div
                      key={key}
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 space-y-3"
                    >
                      <p className="text-sm font-semibold text-on-surface">
                        {itemLabel(group.label, key)}
                      </p>
                      <FieldShell label="Título" required>
                        <Input
                          aria-label={`Título de ${key}`}
                          value={current.title}
                          onChange={(e) => handleFieldChange(key, "title", e.target.value)}
                        />
                      </FieldShell>
                      <FieldShell label="Corpo" required>
                        <textarea
                          aria-label={`Corpo de ${key}`}
                          value={current.body}
                          onChange={(e) => handleFieldChange(key, "body", e.target.value)}
                          className="w-full min-h-24 bg-surface-container-lowest border border-on-surface-variant rounded-xl p-3 text-on-surface outline-none focus:ring-2 focus:ring-primary"
                        />
                      </FieldShell>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          icon={<Save className="size-4" />}
                          disabled={!dirty}
                          loading={saving}
                          onClick={() => void handleSave(key)}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-3">
          Endereço do setor
        </h2>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 space-y-3">
          <FieldShell label="Endereço do setor">
            <Input
              aria-label="Endereço do setor"
              value={addressDraft}
              onChange={(e) => setAddressDraft(e.target.value)}
            />
          </FieldShell>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              icon={<Save className="size-4" />}
              disabled={addressDraft === address}
              loading={savingAddress}
              onClick={() => void handleSaveAddress()}
            >
              Salvar endereço
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
