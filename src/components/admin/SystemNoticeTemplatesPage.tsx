"use client";

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  DoorOpen,
  Eye,
  EyeOff,
  MessageSquareWarning,
  RefreshCw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PanelCard } from "@/components/ui/PanelCard";
import { FieldShell } from "@/components/ui/FieldShell";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { systemNoticeTemplateService } from "@/services/systemNoticeTemplateService";
import type {
  SystemNoticeTemplate,
  SystemNoticeTemplateKey,
} from "@/services/systemNoticeTemplateService";
import { sectorContactInfoService } from "@/services/sectorContactInfoService";

interface TemplateGroup {
  label: string;
  description: string;
  icon: LucideIcon;
  keys: SystemNoticeTemplateKey[];
}

const GROUPS: TemplateGroup[] = [
  {
    label: "Abertura de janela",
    description: "Disparado assim que os alunos passam a poder enviar solicitações.",
    icon: DoorOpen,
    keys: ["WINDOW_OPEN"],
  },
  {
    label: "Fechamento de janela",
    description: "Lembretes enviados na reta final antes da janela fechar.",
    icon: AlarmClock,
    keys: ["WINDOW_CLOSE_7", "WINDOW_CLOSE_3", "WINDOW_CLOSE_1"],
  },
  {
    label: "Reset do ciclo",
    description: "Avisa quem vai perder a carteirinha quando o ciclo reiniciar.",
    icon: RefreshCw,
    keys: ["CYCLE_RESET_7", "CYCLE_RESET_3", "CYCLE_RESET_1"],
  },
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
  return suffix ? `${groupLabel}: ${suffix}` : groupLabel;
}

type Draft = Record<SystemNoticeTemplateKey, { title: string; body: string }>;

function buildDraft(templates: SystemNoticeTemplate[]): Draft {
  const draft = {} as Draft;
  for (const t of templates) {
    draft[t.key] = { title: t.title, body: t.body };
  }
  return draft;
}

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SystemNoticeTemplatesPage({ role }: { role: "admin" | "employee" }) {
  // Funcionário edita os templates; o endereço do setor segue exclusivo do admin.
  const canEditAddress = role === "admin";
  const [templates, setTemplates] = useState<SystemNoticeTemplate[]>([]);
  const [draft, setDraft] = useState<Draft>({} as Draft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKeys, setSavingKeys] = useState<Set<SystemNoticeTemplateKey>>(new Set());
  const [saveErrors, setSaveErrors] = useState<Partial<Record<SystemNoticeTemplateKey, string>>>({});
  const [previewKey, setPreviewKey] = useState<SystemNoticeTemplateKey | null>(null);

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
    if (saveErrors[key]) setSaveErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const isFilled = (key: SystemNoticeTemplateKey) => {
    const current = draft[key];
    return !!current && current.title.trim().length > 0 && current.body.trim().length > 0;
  };

  const handleSave = async (key: SystemNoticeTemplateKey) => {
    const current = draft[key];
    if (!current) return;
    if (!isFilled(key)) {
      setSaveErrors((prev) => ({ ...prev, [key]: "Título e corpo não podem ficar em branco." }));
      return;
    }
    setSavingKeys((prev) => new Set(prev).add(key));
    setSaveErrors((prev) => ({ ...prev, [key]: undefined }));
    try {
      const updated = await systemNoticeTemplateService.update(key, {
        title: current.title.trim(),
        body: current.body.trim(),
      });
      setTemplates((prev) => prev.map((t) => (t.key === key ? updated : t)));
      setDraft((prev) => ({ ...prev, [key]: { title: updated.title, body: updated.body } }));
      toast.success("Template salvo com sucesso.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      const message = e.message ?? "Erro ao salvar template.";
      setSaveErrors((prev) => ({ ...prev, [key]: message }));
      toast.error(message);
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <main className="px-6 py-5 bg-surface">
      <div className="w-full max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-on-surface">Mensagens de sistema</h1>
          <p className="text-sm text-on-surface-variant">
            Edite o título e o corpo dos avisos automáticos enviados aos alunos. O
            texto salvo aqui é o que será usado no próximo disparo automático de
            cada evento.
          </p>
        </header>

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
            description="Nenhum template de aviso foi encontrado. Contate o suporte técnico se isso persistir."
          />
        )}

        {!loading && !error && templates.length > 0 && (
          <div className="flex flex-col gap-6">
            {GROUPS.map((group) => (
              <section key={group.label} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <group.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-on-surface">{group.label}</h2>
                    <p className="text-xs text-on-surface-variant">{group.description}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-l-2 border-outline-variant/50 pl-4">
                  {group.keys.map((key) => {
                    const current = draft[key];
                    if (!current) return null;
                    const dirty = isDirty(key);
                    const saving = savingKeys.has(key);
                    const original = templateByKey(key);
                    const showingPreview = previewKey === key;
                    const titleError = current.title.trim() ? undefined : "Campo obrigatório";
                    const bodyError = current.body.trim() ? undefined : "Campo obrigatório";

                    return (
                      <PanelCard
                        key={key}
                        className={cn(
                          "space-y-3 p-5 transition-colors",
                          dirty && "border-primary/40 bg-primary/3",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-on-surface">
                              {itemLabel(group.label, key)}
                            </p>
                            {dirty && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                não salvo
                              </span>
                            )}
                          </div>
                          {original && (
                            <p className="text-xs text-on-surface-variant shrink-0">
                              Atualizado em {formatUpdatedAt(original.updatedAt)}
                            </p>
                          )}
                        </div>
                        <FieldShell label="Título" required error={titleError}>
                          <Input
                            aria-label={`Título de ${key}`}
                            value={current.title}
                            onChange={(e) => handleFieldChange(key, "title", e.target.value)}
                          />
                        </FieldShell>
                        <FieldShell label="Corpo" required error={bodyError}>
                          <textarea
                            aria-label={`Corpo de ${key}`}
                            value={current.body}
                            onChange={(e) => handleFieldChange(key, "body", e.target.value)}
                            rows={3}
                            className="w-full resize-y rounded-xl border border-on-surface-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary"
                          />
                        </FieldShell>

                        {showingPreview && (
                          <div className="rounded-xl border border-outline-variant/40 bg-surface p-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                              Como o aluno vai ver
                            </p>
                            <p className="text-sm font-semibold text-on-surface">
                              {current.title.trim() || "(sem título)"}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface-variant">
                              {current.body.trim() || "(sem corpo)"}
                            </p>
                          </div>
                        )}

                        {saveErrors[key] && (
                          <p className="text-xs text-error">{saveErrors[key]}</p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewKey(showingPreview ? null : key)}
                            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface"
                          >
                            {showingPreview
                              ? <EyeOff className="size-3.5" />
                              : <Eye className="size-3.5" />}
                            {showingPreview ? "Ocultar prévia" : "Pré-visualizar"}
                          </button>
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
                      </PanelCard>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-on-surface">Endereço do setor</h2>
            <p className="text-xs text-on-surface-variant">
              Mostrado nas mensagens que orientam o aluno a comparecer pessoalmente.
            </p>
          </div>
          <PanelCard className="space-y-3 p-5">
            <FieldShell label="Endereço do setor">
              <Input
                aria-label="Endereço do setor"
                value={addressDraft}
                disabled={!canEditAddress}
                onChange={(e) => setAddressDraft(e.target.value)}
              />
            </FieldShell>
            {canEditAddress ? (
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
            ) : (
              <p className="text-xs text-on-surface-variant">
                Somente administradores alteram o endereço do setor.
              </p>
            )}
          </PanelCard>
        </section>
      </div>
    </main>
  );
}
