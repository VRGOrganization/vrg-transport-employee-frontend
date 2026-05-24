export type CriterionType =
  | "shift"
  | "transport_mode"
  | "distance_km"
  | "has_disability"
  | "course_semester"
  | "university_id"
  | "enrollment_count";

export type CriterionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_or_equal"
  | "less_or_equal"
  | "in"
  | "not_in"
  | "is_true"
  | "is_false";

export type CriteriaLogic = "all" | "any";

export interface Criterion {
  type: CriterionType;
  operator: CriterionOperator;
  value?: string | number | boolean | string[];
}

export interface PriorityRule {
  _id: string;
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  criteria: Criterion[];
  criteriaLogic: CriteriaLogic;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriorityRulePayload {
  level: number;
  name: string;
  description?: string;
  criteria?: Criterion[];
  criteriaLogic?: CriteriaLogic;
  active?: boolean;
  sortOrder?: number;
}

export type UpdatePriorityRulePayload = Partial<CreatePriorityRulePayload>;

export const CRITERION_TYPE_LABELS: Record<CriterionType, string> = {
  shift:            "Turno",
  transport_mode:   "Modo de transporte",
  distance_km:      "Distância (km)",
  has_disability:   "Possui deficiência",
  course_semester:  "Semestre do curso",
  university_id:    "Universidade",
  enrollment_count: "Nº de matrículas",
};

export const OPERATOR_LABELS: Record<CriterionOperator, string> = {
  equals:          "Igual a",
  not_equals:      "Diferente de",
  greater_than:    "Maior que",
  less_than:       "Menor que",
  greater_or_equal:"Maior ou igual a",
  less_or_equal:   "Menor ou igual a",
  in:              "Está em",
  not_in:          "Não está em",
  is_true:         "É verdadeiro",
  is_false:        "É falso",
};
