"use client";

import { Trash2 } from "lucide-react";
import type { Criterion, CriterionType, CriterionOperator } from "@/types/priorityRule";
import { CRITERION_TYPE_LABELS, OPERATOR_LABELS } from "@/types/priorityRule";
import type { University } from "@/types/university.types";

const BOOLEAN_TYPES: CriterionType[] = ["has_disability"];
const ENUM_TYPES: CriterionType[] = ["shift", "transport_mode", "university_id"];
const NUMERIC_TYPES: CriterionType[] = ["distance_km", "course_semester", "enrollment_count"];

const SHIFT_OPTIONS = ["Manhã", "Tarde", "Noite", "Integral"];

function getOperatorsForType(type: CriterionType): CriterionOperator[] {
  if (BOOLEAN_TYPES.includes(type)) return ["is_true", "is_false"];
  if (ENUM_TYPES.includes(type))    return ["equals", "not_equals", "in", "not_in"];
  if (NUMERIC_TYPES.includes(type)) return ["equals", "not_equals", "greater_than", "less_than", "greater_or_equal", "less_or_equal"];
  return ["equals", "not_equals"];
}

const fieldXs =
  "w-full h-8 px-2.5 rounded-lg border border-on-surface-variant ring-0 bg-surface-container-lowest text-xs text-on-surface " +
  "placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none transition-all";

interface CriterionRowProps {
  criterion: Criterion;
  index: number;
  onChange: (c: Criterion) => void;
  onRemove: () => void;
  universities: University[];
}

export function CriterionRow({ criterion, onChange, onRemove, universities }: CriterionRowProps) {
  const operators = getOperatorsForType(criterion.type);
  const showValue  = criterion.operator !== "is_true" && criterion.operator !== "is_false";
  const isListOp   = criterion.operator === "in" || criterion.operator === "not_in";
  const val        = String(criterion.value ?? "");

  const handleTypeChange = (newType: CriterionType) => {
    const ops = getOperatorsForType(newType);
    onChange({ type: newType, operator: ops[0], value: "" });
  };

  const handleOperatorChange = (newOp: CriterionOperator) => {
    onChange({
      ...criterion,
      operator: newOp,
      value: (newOp === "is_true" || newOp === "is_false") ? "" : criterion.value,
    });
  };

  const renderValueField = () => {
    if (!showValue) return null;

    if (criterion.type === "shift") {
      return (
        <select
          value={val}
          onChange={(e) => onChange({ ...criterion, value: e.target.value })}
          className={fieldXs}
        >
          <option value="">Selecione o turno...</option>
          {SHIFT_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }

    if (criterion.type === "university_id") {
      return (
        <select
          value={val}
          onChange={(e) => onChange({ ...criterion, value: e.target.value })}
          className={fieldXs}
        >
          <option value="">Selecione a universidade...</option>
          {universities.map((u) => (
            <option key={u._id} value={u._id}>
              {u.acronym ? `${u.acronym} — ${u.name}` : u.name}
            </option>
          ))}
        </select>
      );
    }

    if (
      criterion.type === "distance_km" ||
      criterion.type === "course_semester" ||
      criterion.type === "enrollment_count"
    ) {
      return (
        <input
          type="text"
          inputMode="numeric"
          value={val}
          onChange={(e) =>
            onChange({ ...criterion, value: e.target.value.replace(/\D/g, "") })
          }
          placeholder="0"
          className={fieldXs}
        />
      );
    }

    // transport_mode and fallback — free text
    return (
      <input
        type="text"
        value={val}
        onChange={(e) => onChange({ ...criterion, value: e.target.value })}
        placeholder={isListOp ? "valor1, valor2, valor3" : "Digite o valor..."}
        className={fieldXs}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-container rounded-xl border border-outline-variant/40">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-on-surface-variant">Tipo</label>
          <select
            value={criterion.type}
            onChange={(e) => handleTypeChange(e.target.value as CriterionType)}
            className={fieldXs}
          >
            {(Object.keys(CRITERION_TYPE_LABELS) as CriterionType[]).map((t) => (
              <option key={t} value={t}>{CRITERION_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-on-surface-variant">Operador</label>
          <select
            value={criterion.operator}
            onChange={(e) => handleOperatorChange(e.target.value as CriterionOperator)}
            className={fieldXs}
          >
            {operators.map((op) => (
              <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
            ))}
          </select>
        </div>
      </div>

      {showValue && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-on-surface-variant">
            Valor
            {isListOp && <span className="font-normal ml-1">(separar por vírgula)</span>}
          </label>
          {renderValueField()}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 text-[11px] text-error/70 hover:text-error transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Remover
        </button>
      </div>
    </div>
  );
}
