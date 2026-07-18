"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldShell } from "@/components/ui/FieldShell";
import { ErrorState } from "@/components/ui/states";
import { toast } from "@/lib/toast";
import { systemNoticeTemplateService } from "@/services/systemNoticeTemplateService";
import type {
  SystemNoticeTemplate,
  SystemNoticeTemplateKey,
} from "@/services/systemNoticeTemplateService";

interface TemplateGroup {
  label: string;
  keys: SystemNoticeTemplateKey[];
}

const GROUPS: TemplateGroup[] = [
  { label: "Abertura de raia", keys: ["WINDOW_OPEN"] },
  { label: "Fechamento de raia", keys: ["WINDOW_CLOSE_7", "WINDOW_CLOSE_3", "WINDOW_CLOSE_1"] },
  { label: "Reset da piscina", keys: ["CYCLE_RESET_7", "CYCLE_RESET_3", "CYCLE_RESET_1"] },
];

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
          Edite o título e o corpo dos avisos automáticos enviados aos alunos.
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

      {!loading && !error && (
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
    </div>
  );
}
