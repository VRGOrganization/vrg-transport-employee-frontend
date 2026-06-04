"use client";

import { X } from "lucide-react";
import type { Criterion, CriterionType, CriterionOperator } from "@/types/priorityRule";
import { CRITERION_TYPE_LABELS } from "@/types/priorityRule";
import type { University } from "@/types/university.types";

const BOOLEAN_TYPES: CriterionType[] = ["has_disability"];
const SHIFT_OPTIONS = ["Manhã", "Tarde", "Noite", "Integral"];

// Operadores em linguagem natural por tipo de campo
const FRIENDLY_OPERATORS: Record<CriterionType, { value: CriterionOperator; label: string }[]> = {
  has_disability: [
    { value: "is_true",  label: "possui" },
    { value: "is_false", label: "não possui" },
  ],
  shift: [
    { value: "equals",     label: "é" },
    { value: "not_equals", label: "não é" },
  ],
  transport_mode: [
    { value: "equals",     label: "é" },
    { value: "not_equals", label: "não é" },
  ],
  university_id: [
    { value: "equals",     label: "é" },
    { value: "not_equals", label: "não é" },
  ],
  distance_km: [
    { value: "greater_than",     label: "maior que" },
    { value: "less_than",        label: "menor que" },
    { value: "greater_or_equal", label: "a partir de" },
    { value: "less_or_equal",    label: "até" },
  ],
  course_semester: [
    { value: "less_or_equal",    label: "até o semestre" },
    { value: "greater_or_equal", label: "a partir do semestre" },
    { value: "equals",           label: "exatamente o semestre" },
  ],
  enrollment_count: [
    { value: "greater_than",     label: "mais de" },
    { value: "less_than",        label: "menos de" },
    { value: "greater_or_equal", label: "a partir de" },
    { value: "less_or_equal",    label: "até" },
    { value: "equals",           label: "exatamente" },
  ],
};

function defaultOperator(type: CriterionType): CriterionOperator {
  return FRIENDLY_OPERATORS[type]?.[0]?.value ?? "equals";
}

const sel =
  "h-8 px-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest " +
  "text-xs text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all";

interface Props {
  criterion: Criterion;
  index: number;
  onChange: (c: Criterion) => void;
  onRemove: () => void;
  universities: University[];
}

export function CriterionRow({ criterion, onChange, onRemove, universities }: Props) {
  const isBoolean  = BOOLEAN_TYPES.includes(criterion.type);
  const operators  = FRIENDLY_OPERATORS[criterion.type] ?? [];
  const val        = String(criterion.value ?? "");

  const handleTypeChange = (newType: CriterionType) => {
    onChange({ type: newType, operator: defaultOperator(newType), value: "" });
  };

  const renderValue = () => {
    if (isBoolean) return null;

    if (criterion.type === "shift") return (
      <select value={val} onChange={(e) => onChange({ ...criterion, value: e.target.value })} className={`${sel} flex-1 min-w-0`}>
        <option value="">Selecione o turno...</option>
        {SHIFT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );

    if (criterion.type === "university_id") return (
      <select value={val} onChange={(e) => onChange({ ...criterion, value: e.target.value })} className={`${sel} flex-1 min-w-0`}>
        <option value="">Selecione a faculdade...</option>
        {universities.map((u) => (
          <option key={u._id} value={u._id}>{u.acronym ? `${u.acronym} — ${u.name}` : u.name}</option>
        ))}
      </select>
    );

    if (criterion.type === "transport_mode") return (
      <select value={val} onChange={(e) => onChange({ ...criterion, value: e.target.value })} className={`${sel} flex-1 min-w-0`}>
        <option value="">Selecione...</option>
        <option value="REGULAR">Regular</option>
        <option value="INTEGRAL">Integral</option>
      </select>
    );

    const unit = criterion.type === "distance_km" ? "km" : criterion.type === "course_semester" ? "º" : "";
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <input
          type="text"
          inputMode="numeric"
          value={val}
          onChange={(e) => onChange({ ...criterion, value: e.target.value.replace(/\D/g, "") })}
          placeholder="0"
          className={`${sel} w-20`}
        />
        {unit && <span className="text-xs text-on-surface-muted shrink-0">{unit}</span>}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40">
      {/* Campo */}
      <select
        value={criterion.type}
        onChange={(e) => handleTypeChange(e.target.value as CriterionType)}
        className={`${sel} shrink-0`}
      >
        {(Object.keys(CRITERION_TYPE_LABELS) as CriterionType[]).map((t) => (
          <option key={t} value={t}>{CRITERION_TYPE_LABELS[t]}</option>
        ))}
      </select>

      {/* Condição */}
      <select
        value={criterion.operator}
        onChange={(e) => onChange({ ...criterion, operator: e.target.value as CriterionOperator })}
        className={`${sel} shrink-0`}
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      {/* Valor */}
      {isBoolean ? <span className="flex-1" /> : renderValue()}

      {/* Remover */}
      <button
        type="button"
        onClick={onRemove}
        title="Remover condição"
        className="p-1 rounded-md text-on-surface-muted hover:text-error hover:bg-error/10 transition-colors shrink-0 cursor-pointer"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
