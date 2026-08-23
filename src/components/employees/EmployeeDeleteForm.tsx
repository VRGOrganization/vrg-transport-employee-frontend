"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertCircle, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import type { Employee } from "@/types/employee";
import { employeeService } from "@/services/employeeService";
import { toTitleCase } from "@/lib/utils/string";

const DELETE_TERMS = `Ao prosseguir com esta ação administrativa, declaro, sob plena consciência e responsabilidade, que estou ciente e em total concordância com as seguintes disposições e consequências jurídico-administrativas da exclusão permanente do cadastro:

§ 1º — Exclusão Definitiva e Irreversível do Cadastro
O registro do funcionário identificado neste ato será removido em caráter permanente da base de dados do Sistema VRG Transport, do serviço de transporte universitário municipalmente administrado pela Prefeitura de São Fidélis — Estado do Rio de Janeiro. Diferentemente da desativação, esta medida NÃO é reversível: uma vez concluída, não existe qualquer procedimento administrativo, funcionalidade do sistema ou recurso técnico capaz de restaurar o cadastro excluído.

§ 2º — Perda Irrecuperável dos Dados de Cadastro
Serão apagados de forma definitiva o nome, o endereço de e-mail, a matrícula funcional, as credenciais de acesso e os demais dados vinculados ao cadastro deste funcionário. Nenhuma cópia recuperável permanecerá acessível pelo sistema, e nenhum administrador — independentemente do nível de privilégio — poderá desfazer esta operação após sua confirmação.

§ 3º — Encerramento Imediato de Sessões e Acessos
Todas as sessões porventura ativas do funcionário nos portais vinculados a esta plataforma serão encerradas de forma imediata e automática, e quaisquer credenciais associadas deixarão de ser reconhecidas pelo sistema no mesmo instante da exclusão.

§ 4º — Necessidade de Novo Cadastro
Caso o funcionário venha a retornar ao quadro funcional, será obrigatório realizar um cadastro inteiramente novo, com nova matrícula e novas credenciais. O histórico anterior de cadastro não será restaurado nem vinculado ao novo registro, pois deixou de existir na base de dados.

§ 5º — Registro Permanente para Fins de Auditoria e Transparência
Os motivos declarados neste ato, bem como os dados de identificação do administrador responsável pela decisão, a data e hora da exclusão e os dados identificadores do cadastro excluído, serão permanentemente preservados no registro de auditoria para fins de transparência administrativa e conformidade com as políticas institucionais. O registro de auditoria é a única evidência remanescente da existência deste cadastro e não permite sua restauração.

§ 6º — Alternativa Menos Gravosa e Responsabilidade Administrativa
Declaro estar ciente de que a desativação do funcionário constitui medida reversível e suficiente para bloquear o acesso ao sistema, e que opto pela exclusão permanente de forma deliberada, por motivos legítimos e devidamente documentados, condizentes com as políticas de uso e as diretrizes do serviço de transporte universitário da Municipalidade de São Fidélis, assumindo integral responsabilidade sobre os efeitos jurídicos e administrativos irreversíveis decorrentes desta decisão.`;

interface EmployeeDeleteFormProps {
  employee: Employee;
  onCancel: () => void;
  onDeleted: () => void;
}

export function EmployeeDeleteForm({ employee, onCancel, onDeleted }: EmployeeDeleteFormProps) {
  const [reasons, setReasons] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const nameMatches =
    confirmName.trim().toLowerCase() === employee.name.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasons.trim()) { setError("Informe o motivo da exclusão."); return; }
    if (reasons.trim().length < 10) { setError("O motivo deve ter ao menos 10 caracteres."); return; }
    if (!nameMatches) { setError("O nome de confirmação não confere com o nome do funcionário."); return; }
    if (!agreed) { setError("Você deve ler e concordar com os termos antes de continuar."); return; }

    setLoading(true);
    setError("");
    try {
      await employeeService.remove(employee._id, [reasons.trim()]);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao excluir o funcionário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-12 text-center">
        <div className="size-16 rounded-full bg-error/10 flex items-center justify-center">
          <Trash2 className="size-8 text-error" />
        </div>
        <div>
          <p className="text-xl font-bold text-on-surface">Funcionário excluído</p>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
            O cadastro de <span className="font-semibold text-on-surface capitalize">{employee.name}</span> foi
            removido permanentemente do sistema. Esta ação não pode ser desfeita.
          </p>
        </div>
        <button
          onClick={onDeleted}
          className="mt-2 px-6 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-sm transition-all cursor-pointer"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error/5 border border-error/20">
          <ShieldAlert className="size-5 text-error shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-error">Ação irreversível e imediata</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Ao confirmar, o cadastro do funcionário será apagado permanentemente do sistema.
              Não há como desfazer: nenhum administrador poderá restaurá-lo. Se você só precisa
              bloquear o acesso, mantenha o funcionário desativado.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-error-container/60 text-error text-xs">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant">
            Motivo da exclusão <span className="text-error">*</span>
          </label>
          <textarea
            value={reasons}
            onChange={(e) => { setReasons(e.target.value); setError(""); }}
            placeholder="Descreva detalhadamente os motivos que justificam a exclusão permanente deste funcionário…"
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-container border-2 border-error text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none resize-none focus:ring-2 focus:ring-error transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant">
            Confirme o nome do funcionário <span className="text-error">*</span>
          </label>
          <p className="text-[11px] text-on-surface-variant mb-1">
            Digite exatamente: <span className="font-bold text-on-surface select-all">{toTitleCase(employee.name)}</span>
          </p>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => { setConfirmName(e.target.value); setError(""); }}
            placeholder="Nome completo do funcionário"
            className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-on-surface-variant text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-error focus:border-error transition-all"
          />
        </div>

        <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
          <button
            type="button"
            onClick={() => { setTermsOpen((prev) => !prev); setHasReadTerms(true); }}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-surface-container-low hover:bg-surface-container transition-colors text-left cursor-pointer"
          >
            <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "18px" }}>gavel</span>
              Termos e consequências da exclusão permanente
              {!hasReadTerms && (
                <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20">
                  Leitura obrigatória
                </span>
              )}
            </span>
            {termsOpen
              ? <ChevronUp className="size-4 text-on-surface-variant shrink-0" />
              : <ChevronDown className="size-4 text-on-surface-variant shrink-0" />
            }
          </button>
          {termsOpen && (
            <div className="px-4 py-4 bg-surface-container-lowest border-t border-outline-variant/20 max-h-64 overflow-y-auto">
              <div className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line space-y-3">
                {DELETE_TERMS.split("\n\n").map((paragraph, i) => (
                  <p key={i} className={paragraph.startsWith("§") ? "font-semibold text-on-surface" : ""}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!hasReadTerms}
          onClick={() => { setAgreed(!agreed); setError(""); }}
          className={`group w-full flex items-start text-left gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
            !hasReadTerms
              ? "border-outline-variant/20 bg-surface-container-lowest opacity-60 cursor-not-allowed"
              : agreed
                ? "border-error bg-error/5 ring-4 ring-error/10 hover:bg-error/10 cursor-pointer"
                : "border-outline-variant/40 bg-surface hover:border-error/40 hover:shadow-md hover:bg-surface-container-lowest cursor-pointer"
          }`}
        >
          <div className={`mt-0.5 size-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
            !hasReadTerms
              ? "border-outline-variant/40 bg-surface-container-low"
              : agreed
                ? "border-error bg-error text-white"
                : "border-outline-variant/60 bg-surface group-hover:border-error/60"
          }`}>
            {agreed && <span className="material-symbols-outlined" style={{ fontSize: "14px", fontWeight: "bold" }}>check</span>}
            {!hasReadTerms && <span className="material-symbols-outlined text-outline-variant/60" style={{ fontSize: "12px" }}>lock</span>}
          </div>
          <div className="flex-1 text-sm leading-snug">
            <p className={`font-bold transition-colors ${agreed ? "text-error" : "text-on-surface group-hover:text-error"}`}>
              Li e concordo com os termos e consequências
            </p>
            <p className={`text-xs mt-0.5 transition-colors ${agreed ? "text-error/80" : "text-on-surface-variant"}`}>
              Confirmo que os motivos informados são legítimos e que estou ciente de que a exclusão não pode ser desfeita.
            </p>
            {!hasReadTerms && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-error/80 bg-error/10 w-fit px-2 py-1 rounded-md uppercase tracking-wide">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>warning</span>
                Abra e leia os termos para habilitar
              </div>
            )}
          </div>
        </button>
      </div>

      <div className="px-8 py-4 bg-surface-container-low border-t border-outline-variant/20 flex gap-3 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !agreed || !reasons.trim() || !nameMatches}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-error text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {loading ? "Excluindo funcionário..." : "Excluir Permanentemente"}
        </button>
      </div>
    </form>
  );
}
