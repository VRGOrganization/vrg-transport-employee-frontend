import type { AuditEvent } from "@/types/audit";

/**
 * Categoria de uma ação de auditoria (derivada do prefixo antes do primeiro
 * ponto/underscore relevante). Cada categoria tem cor própria para leitura
 * rápida na timeline estilo git-log.
 */
export interface AuditCategory {
  key: string;
  label: string;
  /** Prefixos de action que caem nesta categoria. */
  prefixes: string[];
  /** Classe do "nó" (bolinha) e destaque — cores explícitas p/ funcionar em dark/light. */
  dot: string;
  chipBg: string;
  chipText: string;
  ring: string;
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  {
    key: "student",
    label: "Estudante",
    prefixes: ["student.", "register.student"],
    dot: "bg-sky-500",
    chipBg: "bg-sky-500/12",
    chipText: "text-sky-700 dark:text-sky-300",
    ring: "ring-sky-500",
  },
  {
    key: "license",
    label: "Carteirinha",
    prefixes: ["license.", "license_request."],
    dot: "bg-violet-500",
    chipBg: "bg-violet-500/12",
    chipText: "text-violet-700 dark:text-violet-300",
    ring: "ring-violet-500",
  },
  {
    key: "auth",
    label: "Acesso",
    prefixes: [
      "login",
      "logout",
      "admin.login",
      "employee.login",
      "student.login",
      "verify_email",
      "password.",
      "resend_verification_code",
    ],
    dot: "bg-emerald-500",
    chipBg: "bg-emerald-500/12",
    chipText: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500",
  },
  {
    key: "employee",
    label: "Funcionário",
    prefixes: ["employee."],
    dot: "bg-amber-500",
    chipBg: "bg-amber-500/12",
    chipText: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500",
  },
  {
    key: "university",
    label: "Instituição",
    prefixes: ["university.", "course."],
    dot: "bg-rose-500",
    chipBg: "bg-rose-500/12",
    chipText: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500",
  },
  {
    key: "bus",
    label: "Frota",
    prefixes: ["bus."],
    dot: "bg-teal-500",
    chipBg: "bg-teal-500/12",
    chipText: "text-teal-700 dark:text-teal-300",
    ring: "ring-teal-500",
  },
  {
    key: "enrollment",
    label: "Inscrição",
    prefixes: ["enrollment_period.", "enrollment_cycle.", "enrollment_"],
    dot: "bg-indigo-500",
    chipBg: "bg-indigo-500/12",
    chipText: "text-indigo-700 dark:text-indigo-300",
    ring: "ring-indigo-500",
  },
  {
    key: "config",
    label: "Configuração",
    prefixes: [
      "priority_rule.",
      "system_notice_template.",
      "sector_contact_info.",
      "notice.",
      "image.",
    ],
    dot: "bg-fuchsia-500",
    chipBg: "bg-fuchsia-500/12",
    chipText: "text-fuchsia-700 dark:text-fuchsia-300",
    ring: "ring-fuchsia-500",
  },
];

const FALLBACK_CATEGORY: AuditCategory = {
  key: "other",
  label: "Outro",
  prefixes: [],
  dot: "bg-neutral-400",
  chipBg: "bg-neutral-400/12",
  chipText: "text-neutral-600 dark:text-neutral-300",
  ring: "ring-neutral-400",
};

export function categorizeAction(action: string): AuditCategory {
  for (const category of AUDIT_CATEGORIES) {
    if (
      category.prefixes.some((p) =>
        p.endsWith(".") || p.endsWith("_")
          ? action.startsWith(p)
          : action === p || action.includes(p),
      )
    ) {
      return category;
    }
  }
  return FALLBACK_CATEGORY;
}

/** Rótulos PT-BR legíveis para as ações mais comuns. Fallback: a própria action. */
const ACTION_LABELS: Record<string, string> = {
  "student.login": "Login de estudante",
  "admin.login": "Login de administrador",
  "employee.login": "Login de funcionário",
  "student.login.pending_reissue_otp":
    "Login de estudante (código de reemissão)",
  logout: "Encerramento de sessão",
  verify_email: "Verificação de e-mail",
  resend_verification_code: "Reenvio de código de verificação",
  "password.reset": "Redefinição de senha",
  "register.student": "Cadastro de estudante",
  "register.student.conflict": "Cadastro de estudante (conflito)",
  "student.ban": "Banimento de estudante",
  "student.unban": "Desbanimento de estudante",
  "student.verify": "Aprovação de estudante",
  "student.update": "Edição de estudante",
  "student.adminCreate": "Cadastro de estudante (admin)",
  "student.deactivate": "Desativação de estudante",
  "student.activate": "Ativação de estudante",
  "student.remove": "Remoção de estudante",
  "student.email_correction": "Correção de e-mail do estudante",
  "student.personal_documents.upload": "Envio de documentos do estudante",
  "license.create": "Emissão de carteirinha",
  "license.update": "Atualização de carteirinha",
  "license.update_existing": "Atualização de carteirinha existente",
  "license.reject": "Recusa de carteirinha",
  "license.remove": "Remoção de carteirinha",
  "license.deactivation_requested": "Solicitação de baixa de carteirinha",
  "license.deactivation_approved": "Baixa de carteirinha aprovada",
  "license.deactivation_refused": "Baixa de carteirinha recusada",
  "license_request.create": "Pedido de carteirinha",
  "license_request.create_update": "Atualização de pedido de carteirinha",
  "license_request.approve": "Aprovação de pedido",
  "license_request.approve_reissue": "Aprovação de reemissão",
  "license_request.approve_reissue_batch": "Aprovação de reemissão em lote",
  "license_request.reject": "Recusa de pedido",
  "license_request.request_revision": "Pedido enviado para revisão",
  "license_request.submit_revision": "Revisão enviada",
  "license_request.admin_created": "Pedido criado pelo admin",
  "university.create": "Criação de instituição",
  "university.update": "Edição de instituição",
  "university.activate": "Ativação de instituição",
  "university.deactivate": "Desativação de instituição",
  "course.create": "Criação de curso",
  "course.update": "Edição de curso",
  "course.deactivate": "Desativação de curso",
  "course.reactivate": "Reativação de curso",
  "employee.create": "Cadastro de funcionário",
  "employee.create.password_reset_failed":
    "Cadastro de funcionário (falha ao enviar senha)",
  "employee.update": "Edição de funcionário",
  "employee.activate": "Ativação de funcionário",
  "employee.deactivate": "Desativação de funcionário",
  "bus.create": "Cadastro de ônibus",
  "bus.update": "Edição de ônibus",
  "bus.activate": "Ativação de ônibus",
  "bus.deactivate": "Desativação de ônibus",
  "bus.link_university": "Vínculo de instituição ao ônibus",
  "bus.unlink_university": "Desvínculo de instituição do ônibus",
  "bus.update_university_slots": "Atualização de vagas por instituição",
  "bus.release_slots": "Liberação de vagas do ônibus",
  "bus.release_slots_promote": "Liberação de vagas e promoção da fila",
  "bus.resync_filled_slots": "Ressincronização de vagas ocupadas",
  "enrollment_period.create": "Criação de período de inscrição",
  "enrollment_period.open_window": "Abertura de janela de inscrição",
  "enrollment_period.close_window": "Fechamento de janela de inscrição",
  "enrollment_period.close": "Encerramento de período de inscrição",
  "enrollment_cycle.reset": "Reinício do ciclo de inscrição",
  "enrollment_cycle_reset_warning_job.run":
    "Aviso de reinício do ciclo de inscrição",
  "enrollment_cycle_reset_job.run": "Reinício automático do ciclo de inscrição",
  "enrollment_window_close_warning_job.run":
    "Aviso de fechamento da janela de inscrição",
  "enrollment_warning_job.run": "Aviso do período de inscrição",
  "priority_rule.create": "Criação de regra de prioridade",
  "priority_rule.update": "Edição de regra de prioridade",
  "priority_rule.toggle": "Alternância de regra de prioridade",
  "priority_rule.deactivate": "Desativação de regra de prioridade",
  "priority_rule.evaluate": "Avaliação de regra de prioridade",
  "sector_contact_info.update": "Atualização de contato do setor",
  "system_notice_template.update": "Atualização de mensagem de sistema",
  "image.access": "Acesso a imagem",
  "license_expiration_job.run": "Expiração automática de carteirinhas",
  "pending_expiration_job.run": "Expiração automática de pendências",
};

/**
 * Fallback legível para actions ainda não mapeadas: nunca exibe o código cru
 * (ex.: `bus.update_university_slots`). Remove sufixo de job, troca `.`/`_` por
 * espaço e capitaliza a primeira letra — garante que "qualquer outro registro"
 * siga o mesmo padrão de exibição PT-BR.
 */
function humanizeAction(action: string): string {
  const cleaned = action
    .replace(/_job\.run$/, "")
    .replace(/[._]+/g, " ")
    .trim();
  if (!cleaned) return action;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanizeAction(action);
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  employee: "Funcionário",
  student: "Estudante",
};

/** Rótulo PT-BR do papel — o admin nunca vê o código cru do papel. */
export function roleLabel(role: string | null | undefined): string {
  if (!role) return "-";
  return ROLE_LABELS[role] ?? role;
}

/** Lista de opções (value + label) para o filtro de tipo de ação por categoria. */
export function categoryFilterOptions() {
  return AUDIT_CATEGORIES.map((c) => ({ value: c.key, label: c.label }));
}

/** Resolve a categoria de um evento diretamente. */
export function eventCategory(event: Pick<AuditEvent, "action">): AuditCategory {
  return categorizeAction(event.action);
}
