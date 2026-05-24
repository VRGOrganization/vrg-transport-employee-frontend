"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { priorityRuleService } from "@/services/priorityRuleService";
import type {
  PriorityRule,
  PriorityCriterion,
  PriorityCriterionType,
  PriorityCriterionOperator,
  CriteriaLogic,
} from "@/types/priorityRule";

interface PriorityRuleModalProps {
  open: boolean;
  initial: PriorityRule | null;
  onClose: () => void;
  onSaved: (rule: PriorityRule) => void;
  onDeleted: (id: string) => void;
}

interface FormState {
  level: string;
  name: string;
  description: string;
  criteriaLogic: CriteriaLogic;
  sortOrder: string;
  active: boolean;
  criteria: PriorityCriterion[];
}

const CRITERION_TYPE_LABELS: Record<PriorityCriterionType, string> = {
  shift: "Turno",
  transport_mode: "Modo de Transporte",
  distance_km: "Distância (km)",
  has_disability: "Possui Deficiência",
  course_semester: "Semestre do Curso",
  university_id: "Universidade",
  enrollment_count: "Nº de Inscrições",
};

const OPERATOR_LABELS: Record<PriorityCriterionOperator, string> = {
  equals: "Igual a",
  not_equals: "Diferente de",
  greater_than: "Maior que",
  less_than: "Menor que",
  greater_or_equal: "Maior ou igual a",
  less_or_equal: "Menor ou igual a",
  in: "Está em (lista)",
  not_in: "Não está em (lista)",
  is_true: "É verdadeiro",
  is_false: "É falso",
};

const BOOLEAN_TYPES: PriorityCriterionType[] = ["has_disability"];
const ENUM_TYPES: PriorityCriterionType[] = ["shift", "transport_mode", "university_id"];
const NUMERIC_TYPES: PriorityCriterionType[] = ["distance_km", "course_semester", "enrollment_count"];

function getOperatorsForType(type: PriorityCriterionType): PriorityCriterionOperator[] {
  if (BOOLEAN_TYPES.includes(type)) return ["is_true", "is_false"];
  if (ENUM_TYPES.includes(type)) return ["equals", "not_equals", "in", "not_in"];
  if (NUMERIC_TYPES.includes(type)) return ["equals", "not_equals", "greater_than", "less_than", "greater_or_equal", "less_or_equal"];
  return ["equals", "not_equals"];
}

function buildEmptyCriterion(): PriorityCriterion {
  return { type: "shift", operator: "equals", value: "" };
}

function buildFormState(rule: PriorityRule | null): FormState {
  if (!rule) {
    return { level: "1", name: "", description: "", criteriaLogic: "all", sortOrder: "0", active: true, criteria: [] };
  }
  return {
    level: String(rule.level),
    name: rule.name,
    description: rule.description ?? "",
    criteriaLogic: rule.criteriaLogic,
    sortOrder: String(rule.sortOrder),
    active: rule.active,
    criteria: rule.criteria.map((c) => ({
      ...c,
      value: Array.isArray(c.value) ? c.value.join(", ") : c.value !== undefined ? String(c.value) : "",
    })) as PriorityCriterion[],
  };
}

// ring-1 ring-outline — box-shadow, not affected by the global `border: none` reset in globals.css
const field =
  "w-full px-3 rounded-lg ring-1 ring-outline bg-surface-container-lowest text-sm text-on-surface " +
  "placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none transition-all";

const fieldSm = `${field} h-9`;
const fieldXs = `${field} h-8 text-xs`;

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-on-surface-variant">
      {children}
      {required && <span className="text-error ml-0.5">*</span>}
    </label>
  );
}

export function PriorityRuleModal({
  open,
  initial,
  onClose,
  onSaved,
  onDeleted,
}: PriorityRuleModalProps) {
  const [view, setView] = useState<"form" | "confirm">("form");
  const [form, setForm] = useState<FormState>(() => buildFormState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [lastInitialId, setLastInitialId] = useState(initial?._id ?? null);
  if ((initial?._id ?? null) !== lastInitialId) {
    setLastInitialId(initial?._id ?? null);
    setForm(buildFormState(initial));
    setErrors({});
    setError("");
    setView("form");
  }

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const setCriterionField = (idx: number, key: keyof PriorityCriterion, val: string) => {
    setForm((prev) => {
      const criteria = [...prev.criteria];
      const c = { ...criteria[idx] };
      if (key === "type") {
        const t = val as PriorityCriterionType;
        c.type = t;
        c.operator = getOperatorsForType(t)[0];
        c.value = "";
      } else if (key === "operator") {
        c.operator = val as PriorityCriterionOperator;
        if (val === "is_true" || val === "is_false") c.value = "";
      } else {
        c.value = val as unknown as string;
      }
      criteria[idx] = c;
      return { ...prev, criteria };
    });
  };

  const addCriterion = () =>
    setForm((prev) => ({ ...prev, criteria: [...prev.criteria, buildEmptyCriterion()] }));

  const removeCriterion = (idx: number) =>
    setForm((prev) => ({ ...prev, criteria: prev.criteria.filter((_, i) => i !== idx) }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const level = Number(form.level);
    if (!form.level || isNaN(level) || level < 1 || level > 5 || !Number.isInteger(level))
      errs.level = "Nível deve ser um inteiro entre 1 e 5.";
    if (!form.name.trim()) errs.name = "Nome é obrigatório.";
    else if (form.name.trim().length > 100) errs.name = "Máximo 100 caracteres.";
    if (form.sortOrder !== "" && (isNaN(Number(form.sortOrder)) || Number(form.sortOrder) < 0))
      errs.sortOrder = "Deve ser um número ≥ 0.";
    form.criteria.forEach((c, i) => {
      if (!c.type) errs[`criteria_${i}_type`] = "Selecione um tipo.";
      if (!c.operator) errs[`criteria_${i}_operator`] = "Selecione um operador.";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => ({
    level: Number(form.level),
    name: form.name.trim(),
    description: form.description.trim(),
    criteriaLogic: form.criteriaLogic,
    sortOrder: Number(form.sortOrder) || 0,
    active: form.active,
    criteria: form.criteria.map((c) => ({
      type: c.type,
      operator: c.operator,
      ...(c.operator === "is_true" || c.operator === "is_false"
        ? {}
        : {
            value:
              c.operator === "in" || c.operator === "not_in"
                ? String(c.value ?? "").split(",").map((s) => s.trim()).filter(Boolean)
                : String(c.value ?? ""),
          }),
    })),
  });

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const payload = buildPayload();
      const saved = initial
        ? await priorityRuleService.update(initial._id, payload)
        : await priorityRuleService.create(payload);
      onSaved(saved);
    } catch {
      setError("Não foi possível salvar a regra. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setLoading(true);
    setError("");
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

  // ── Confirm view ───────────────────────────────────────────────────────────
  if (view === "confirm") {
    return (
      <Modal
        open={open}
        onClose={() => setView("form")}
        title="Excluir regra de prioridade"
        size="sm"
        closeOnBackdrop={false}
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="p-4 rounded-full bg-error/10">
            <AlertTriangle className="w-9 h-9 text-error" />
          </div>
          <p className="text-sm text-on-surface-variant max-w-xs">
            Esta ação desativa permanentemente a regra{" "}
            <strong className="text-on-surface">{initial?.name}</strong>.
            Ela deixará de ser avaliada em novas solicitações.
          </p>
        </div>
        {error && <p className="mt-3 text-sm text-error text-center">{error}</p>}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" size="sm" fullWidth onClick={() => setView("form")} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            loading={loading}
            onClick={() => void handleDelete()}
            className="bg-error hover:bg-error/90 text-white border-0"
          >
            Confirmar exclusão
          </Button>
        </div>
      </Modal>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Editar regra" : "Nova regra de prioridade"}
      size="lg"
      closeOnBackdrop={false}
    >
      <div className="flex flex-col gap-5">

        {/* Level + SortOrder */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label required>Nível</Label>
            <select
              value={form.level}
              onChange={(e) => setField("level", e.target.value)}
              className={fieldSm}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} — {n === 1 ? "Maior prioridade" : n === 5 ? "Menor prioridade" : `Prioridade ${n}`}
                </option>
              ))}
            </select>
            {errors.level && <p className="text-xs text-error">{errors.level}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Ordem de exibição</Label>
            <input
              type="text"
              inputMode="numeric"
              value={form.sortOrder}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setField("sortOrder", digits);
              }}
              placeholder="0"
              className={fieldSm}
            />
            {errors.sortOrder && <p className="text-xs text-error">{errors.sortOrder}</p>}
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label required>Nome</Label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Ex: Alunos com deficiência"
            className={fieldSm}
          />
          {errors.name && <p className="text-xs text-error">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label>Descrição</Label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Descreva o objetivo desta regra..."
            rows={2}
            className={`${field} py-2 resize-none`}
          />
        </div>

        {/* CriteriaLogic + Active */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Lógica dos critérios</Label>
            <select
              value={form.criteriaLogic}
              onChange={(e) => setField("criteriaLogic", e.target.value as CriteriaLogic)}
              className={fieldSm}
            >
              <option value="all">Todos os critérios (E)</option>
              <option value="any">Qualquer critério (OU)</option>
            </select>
          </div>

          {/* Active toggle card */}
          <div className="flex flex-col gap-1.5">
            <Label>Status da regra</Label>
            <button
              type="button"
              onClick={() => setField("active", !form.active)}
              className={`h-9 flex items-center gap-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                form.active
                  ? "border-success bg-success/10 text-success"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  form.active ? "border-success bg-success" : "border-outline-variant"
                }`}
              >
                {form.active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              {form.active ? "Regra ativa" : "Regra inativa"}
            </button>
          </div>
        </div>

        {/* Criteria */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-on-surface-variant">
              Critérios
              {form.criteria.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                  {form.criteria.length}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={addCriterion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 hover:border-primary/70 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar critério
            </button>
          </div>

          {form.criteria.length === 0 && (
            <p className="text-xs text-on-surface-variant/60 italic px-1">
              Nenhum critério adicionado. A regra será aplicada a todos os alunos.
            </p>
          )}

          {form.criteria.map((criterion, idx) => {
            const operators = getOperatorsForType(criterion.type);
            const showValue = criterion.operator !== "is_true" && criterion.operator !== "is_false";
            const isListOp = criterion.operator === "in" || criterion.operator === "not_in";

            return (
              <div
                key={idx}
                className="flex flex-col gap-2 p-3 bg-surface-container rounded-xl border border-outline-variant/40"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-on-surface-variant">Tipo</label>
                    <select
                      value={criterion.type}
                      onChange={(e) => setCriterionField(idx, "type", e.target.value)}
                      className={fieldXs}
                    >
                      {(Object.keys(CRITERION_TYPE_LABELS) as PriorityCriterionType[]).map((t) => (
                        <option key={t} value={t}>{CRITERION_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    {errors[`criteria_${idx}_type`] && (
                      <p className="text-[11px] text-error">{errors[`criteria_${idx}_type`]}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-on-surface-variant">Operador</label>
                    <select
                      value={criterion.operator}
                      onChange={(e) => setCriterionField(idx, "operator", e.target.value)}
                      className={fieldXs}
                    >
                      {operators.map((op) => (
                        <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                      ))}
                    </select>
                    {errors[`criteria_${idx}_operator`] && (
                      <p className="text-[11px] text-error">{errors[`criteria_${idx}_operator`]}</p>
                    )}
                  </div>
                </div>

                {showValue && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-on-surface-variant">
                      Valor
                      {isListOp && <span className="font-normal ml-1">(separar por vírgula)</span>}
                    </label>
                    <input
                      type="text"
                      value={String(criterion.value ?? "")}
                      onChange={(e) => setCriterionField(idx, "value", e.target.value)}
                      placeholder={isListOp ? "valor1, valor2, valor3" : "Digite o valor..."}
                      className={fieldXs}
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCriterion(idx)}
                    className="flex items-center gap-1 text-[11px] text-error/70 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && <p className="text-sm text-error">{error}</p>}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1">
          {initial && (
            <button
              type="button"
              onClick={() => setView("confirm")}
              disabled={loading}
              className="text-sm font-medium text-error/80 hover:text-error underline underline-offset-2 transition-colors disabled:opacity-50 mr-auto"
            >
              Excluir regra
            </button>
          )}
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" loading={loading} onClick={() => void handleSubmit()}>
            {initial ? "Salvar alterações" : "Criar regra"}
          </Button>
        </div>

      </div>
    </Modal>
  );
}
