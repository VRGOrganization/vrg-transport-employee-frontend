import type { EnrollmentWindowEligibilityScope } from "@/types/enrollmentPeriod";

export interface EnrollmentWindowScopeOption {
  value: EnrollmentWindowEligibilityScope;
  label: string;
  description: string;
}

/**
 * Fonte única dos rótulos de escopo: o modal de abrir janela oferece as
 * opções e o de editar apenas exibe a escolhida — sem o texto divergir entre
 * as duas telas.
 */
export const ENROLLMENT_WINDOW_SCOPE_OPTIONS: EnrollmentWindowScopeOption[] = [
  {
    value: "all",
    label: "Todos os alunos",
    description: "Qualquer aluno pode enviar solicitação nessa janela.",
  },
  {
    value: "has_university",
    label: "Só alunos com faculdade cadastrada",
    description: "Exclui alunos sem faculdade vinculada ao cadastro.",
  },
  {
    value: "specific_universities",
    label: "Faculdades específicas",
    description: "Restringe a uma ou mais faculdades escolhidas abaixo.",
  },
];

export function enrollmentWindowScopeLabel(
  scope: EnrollmentWindowEligibilityScope | null | undefined,
): string {
  if (!scope) return "Não informado";
  return (
    ENROLLMENT_WINDOW_SCOPE_OPTIONS.find((option) => option.value === scope)
      ?.label ?? "Não informado"
  );
}
