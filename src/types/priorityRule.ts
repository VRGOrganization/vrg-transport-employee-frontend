export type CriterionType = "already_uses_transport" | "has_disability";

export type CriteriaLogic = "all" | "any";

export interface Criterion {
  type: CriterionType;
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
  already_uses_transport: "Já usa o sistema de transporte",
  has_disability: "É pessoa com deficiência (PCD)",
};
