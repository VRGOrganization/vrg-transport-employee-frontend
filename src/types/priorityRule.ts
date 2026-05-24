export type PriorityCriterionType =
  | "shift"
  | "transport_mode"
  | "distance_km"
  | "has_disability"
  | "course_semester"
  | "university_id"
  | "enrollment_count";

export type PriorityCriterionOperator =
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

export interface PriorityCriterion {
  type: PriorityCriterionType;
  operator: PriorityCriterionOperator;
  value?: string | number | boolean | string[];
}

export interface PriorityRule {
  _id: string;
  level: number;
  name: string;
  description: string;
  criteria: PriorityCriterion[];
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
  criteria?: PriorityCriterion[];
  criteriaLogic?: CriteriaLogic;
  active?: boolean;
  sortOrder?: number;
}

export type UpdatePriorityRulePayload = Partial<CreatePriorityRulePayload>;
