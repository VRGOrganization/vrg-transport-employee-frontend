"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { priorityRuleService } from "@/services/priorityRuleService";
import type { PriorityRule, CriteriaLogic } from "@/types/priorityRule";
import { CRITERION_TYPE_LABELS } from "@/types/priorityRule";

interface Props {
  open: boolean;
  initial: PriorityRule | null;
  /** sortOrder a atribuir a uma regra nova, de forma que ela caia no fim da
   * lista em vez de saltar na frente de regras já organizadas (ver buildPayload). */
  nextSortOrder: number;
  onClose: () => void;
  onSaved: (rule: PriorityRule) => void;
  onDeleted: (id: string) => void;
}

interface FormState {
  level: string;
  name: string;
  description: string;
  criteriaLogic: CriteriaLogic;
  active: boolean;
  alreadyUsesTransport: boolean;
  hasDisability: boolean;
}

function buildFormState(rule: PriorityRule | null): FormState {
  if (!rule) {
    return {
      level: "1",
      name: "",
      description: "",
      criteriaLogic: "all",
      active: true,
      alreadyUsesTransport: false,
      hasDisability: false,
    };
  }
  return {
    level:         String(rule.level),
    name:          rule.name,
    description:   rule.description ?? "",
    criteriaLogic: rule.criteriaLogic,
    active:        rule.active,
    alreadyUsesTransport: rule.criteria.some((c) => c.type === "already_uses_transport"),
    hasDisability:        rule.criteria.some((c) => c.type === "has_disability"),
  };
}

const field =
  "w-full px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface " +
  "placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none transition-all";
const fieldH = `${field} h-9`;

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-on-surface-variant">
      {children}{required && <span className="text-error ml-0.5">*</span>}
    </label>
  );
}

export function PriorityRuleModal({ open, initial, nextSortOrder, onClose, onSaved, onDeleted }: Props) {
  const [view, setView]       = useState<"form" | "confirm">("form");
  const [form, setForm]       = useState<FormState>(() => buildFormState(initial));
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [lastId, setLastId] = useState(initial?._id ?? null);
  if ((initial?._id ?? null) !== lastId) {
    setLastId(initial?._id ?? null);
    setForm(buildFormState(initial));
    setErrors({});
    setError("");
    setView("form");
  }

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const bothChecked = form.alreadyUsesTransport && form.hasDisability;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const level = Number(form.level);
    if (!form.level || isNaN(level) || level < 1 || level > 5 || !Number.isInteger(level))
      errs.level = "Selecione a prioridade.";
    if (!form.name.trim()) errs.name = "Nome é obrigatório.";
    else if (form.name.trim().length > 100) errs.name = "Máximo 100 caracteres.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => ({
    level:         Number(form.level),
    name:          form.name.trim(),
    description:   form.description.trim(),
    criteriaLogic: form.criteriaLogic,
    sortOrder:     initial?.sortOrder ?? nextSortOrder,
    active:        form.active,
    criteria: [
      ...(form.alreadyUsesTransport ? [{ type: "already_uses_transport" as const }] : []),
      ...(form.hasDisability ? [{ type: "has_disability" as const }] : []),
    ],
  });

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const saved = initial
        ? await priorityRuleService.update(initial._id, buildPayload())
        : await priorityRuleService.create(buildPayload());
      onSaved(saved);
    } catch {
      setError("Não foi possível salvar a regra. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setLoading(true); setError("");
    try {
      await priorityRuleService.deactivate(initial._id);
      onDeleted(initial._id);
    } catch {
      setError("Não foi possível excluir a regra. Tente novamente.");
      setView("form");
    } finally {
      setLoading(false);
    }
  };

  // ── Confirm delete ───────────────────────────────────────────────────────────
  if (view === "confirm") {
    return (
      <Modal open={open} onClose={() => setView("form")} title="Desativar regra?" size="sm" closeOnBackdrop={false}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="p-4 rounded-full bg-error/10">
            <AlertTriangle className="size-9 text-error" />
          </div>
          <p className="text-sm text-on-surface-variant max-w-xs">
            A regra <strong className="text-on-surface">{initial?.name}</strong> será
            desativada e deixará de ser usada nos desempates. Ela continua listada na
            aba &quot;Inativas&quot; e pode ser reativada depois.
          </p>
        </div>
        {error && <p className="mt-3 text-sm text-error text-center">{error}</p>}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" size="sm" fullWidth onClick={() => setView("form")} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" fullWidth loading={loading} onClick={() => void handleDelete()} className="bg-error hover:bg-error/90 text-white border-0">
            Confirmar desativação
          </Button>
        </div>
      </Modal>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Editar regra" : "Nova regra de prioridade"}
      size="lg"
      closeOnBackdrop={false}
    >
      <div className="flex flex-col gap-5">

        {/* Nível + Nome */}
        <div className="grid grid-cols-[140px_1fr] gap-4">
          <div className="flex flex-col gap-1.5">
            <Label required>Prioridade</Label>
            <select value={form.level} onChange={(e) => setField("level", e.target.value)} className={fieldH}>
              <option value="1">1ª — Máxima</option>
              <option value="2">2ª — Alta</option>
              <option value="3">3ª — Média</option>
              <option value="4">4ª — Baixa</option>
              <option value="5">5ª — Padrão</option>
            </select>
            {errors.level && <p className="text-xs text-error">{errors.level}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label required>Nome da regra</Label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Ex: Alunos que vão e voltam todos os dias"
              className={fieldH}
            />
            {errors.name && <p className="text-xs text-error">{errors.name}</p>}
          </div>
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <Label>Descrição <span className="text-on-surface-muted font-normal">(opcional)</span></Label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Explique em poucas palavras para que serve esta regra..."
            rows={2}
            className={`${field} py-2 resize-none`}
          />
        </div>

        {/* Condições */}
        <div className="flex flex-col gap-3">
          <Label>Condições</Label>

          <label className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer">
            <input
              type="checkbox"
              checked={form.alreadyUsesTransport}
              onChange={(e) => setField("alreadyUsesTransport", e.target.checked)}
              className="size-4 accent-primary cursor-pointer"
            />
            <span className="text-sm text-on-surface">
              {CRITERION_TYPE_LABELS.already_uses_transport}
            </span>
          </label>

          <label className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasDisability}
              onChange={(e) => setField("hasDisability", e.target.checked)}
              className="size-4 accent-primary cursor-pointer"
            />
            <span className="text-sm text-on-surface">
              {CRITERION_TYPE_LABELS.has_disability}
            </span>
          </label>

          {!form.alreadyUsesTransport && !form.hasDisability && (
            <p className="text-xs text-on-surface-variant/60 italic px-1">
              Nenhuma condição marcada — esta regra será aplicada a todos os alunos em situação de empate.
            </p>
          )}

          {bothChecked && (
            <div className="flex flex-col gap-1.5 mt-1">
              <Label>Como aplicar as duas condições</Label>
              <div className="flex gap-2">
                {(["all", "any"] as CriteriaLogic[]).map((logic) => (
                  <button
                    key={logic}
                    type="button"
                    onClick={() => setField("criteriaLogic", logic)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      form.criteriaLogic === logic
                        ? "bg-primary text-white border-primary"
                        : "border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
                    }`}
                  >
                    {logic === "all" ? "O aluno deve atender TODAS as condições" : "Basta atender UMA das condições"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <Label>Status da regra</Label>
          <button
            type="button"
            onClick={() => setField("active", !form.active)}
            className={`h-9 flex items-center gap-2.5 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
              form.active
                ? "border-success bg-success/10 text-success"
                : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
            }`}
          >
            <span className={`size-4 rounded-full border-2 flex items-center justify-center transition-all ${form.active ? "border-success bg-success" : "border-outline-variant"}`}>
              {form.active && <span className="size-1.5 rounded-full bg-white" />}
            </span>
            {form.active ? "Regra ativa — será usada nos desempates" : "Regra inativa — não será usada"}
          </button>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1">
          {initial && (
            <button
              type="button"
              onClick={() => setView("confirm")}
              disabled={loading}
              className="text-sm font-medium text-error/80 hover:text-error underline underline-offset-2 transition-colors disabled:opacity-50 mr-auto cursor-pointer"
            >
              Desativar regra
            </button>
          )}
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={() => void handleSubmit()}>
            {initial ? "Salvar alterações" : "Criar regra"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
