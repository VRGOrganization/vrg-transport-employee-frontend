"use client";

import { useState, useRef } from "react";
import { Ban, Loader2, AlertCircle, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import type { Student } from "@/types/student";
import { banlistService } from "@/services/banlistService";

const BAN_TERMS = `Ao prosseguir com esta ação administrativa, declaro, sob plena consciência e responsabilidade, que estou ciente e em total concordância com as seguintes disposições e consequências jurídico-administrativas do banimento:

§ 1º — Restrição de Acesso Imediata e Irrestrita
O estudante identificado neste registro terá todos os seus acessos aos serviços de transporte universitário municipalmente administrados pela Prefeitura de São Fidélis — Estado do Rio de Janeiro — revogados com efeito imediato, incluindo, mas não se limitando a: solicitações de carteirinha de transporte estudantil, inscrições em períodos de acesso, reserva de assentos em ônibus universitários e consulta a quaisquer benefícios vinculados ao Sistema VRG Transport.

§ 2º — Encerramento de Sessões e Desativação de Conta
Todas as sessões ativas do estudante nos portais vinculados a esta plataforma serão encerradas de forma imediata e automática. A conta do estudante será desativada no mesmo instante, impossibilitando novos acessos enquanto o banimento permanecer em vigor.

§ 3º — Bloqueio Permanente de Recadastramento
O CPF e o endereço de e-mail do estudante serão registrados na lista de restrições do sistema, impedindo qualquer tentativa de novo cadastro com as mesmas credenciais enquanto a vigência do banimento não for revogada por ato administrativo formal, garantindo a integridade e a efetividade da medida adotada.

§ 4º — Reversibilidade do Banimento por Ato Administrativo
O banimento é uma medida administrativa de caráter temporário e reversível. Um administrador devidamente autorizado e credenciado poderá revogar esta restrição a qualquer tempo, mediante o registro formal de justificativa no sistema, restaurando integralmente os privilégios do estudante conforme os procedimentos e as normativas vigentes da instituição. A reversibilidade não isenta o ato presente de seus efeitos imediatos.

§ 5º — Registro Permanente para Fins de Auditoria e Transparência
Os motivos declarados neste ato, bem como os dados de identificação do administrador responsável pela decisão, a data e hora do banimento, serão permanentemente vinculados ao registro do estudante para fins de auditoria, transparência administrativa e conformidade com as políticas institucionais de gestão do serviço de transporte universitário da municipalidade.

§ 6º — Responsabilidade Administrativa
Declaro, por fim, que esta ação é fundamentada em motivos legítimos, devidamente documentados e plenamente condizentes com as políticas de uso e as diretrizes do serviço de transporte universitário da Municipalidade de São Fidélis, assumindo integral responsabilidade sobre os efeitos jurídicos e administrativos decorrentes desta decisão.`;

interface BanFormProps {
  student: Student;
  onCancel: () => void;
  onBanned: () => void;
}

export function BanForm({ student, onCancel, onBanned }: BanFormProps) {
  const [banReasons, setBanReasons] = useState("");
  const [banConfirmName, setBanConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banReasons.trim()) { setError("Informe o motivo do banimento."); return; }
    if (banConfirmName.trim() !== student.name.trim()) { setError("O nome de confirmação não confere com o nome do estudante."); return; }
    if (!agreed) { setError("Você deve ler e concordar com os termos antes de continuar."); return; }

    setLoading(true);
    setError("");
    try {
      await banlistService.ban(student._id, [banReasons.trim()]);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao banir o estudante. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-12 text-center">
        <div className="size-16 rounded-full bg-error/10 flex items-center justify-center">
          <Ban className="size-8 text-error" />
        </div>
        <div>
          <p className="text-xl font-bold text-on-surface">Banimento aplicado</p>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
            O estudante <span className="font-semibold text-on-surface">{student.name}</span> foi
            banido do sistema. Todas as suas sessões foram encerradas.
          </p>
        </div>
        <button
          onClick={onBanned}
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
            <p className="text-sm font-semibold text-error">Ação reversível imediata</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Ao confirmar, o estudante perderá acesso ao sistema imediatamente. O banimento pode
              ser removido posteriormente por um administrador.
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
            Motivo do banimento <span className="text-error">*</span>
          </label>
          <textarea
            value={banReasons}
            onChange={(e) => { setBanReasons(e.target.value); setError(""); }}
            placeholder="Descreva detalhadamente os motivos que justificam o banimento deste estudante…"
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-container border-2 border-error text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none resize-none focus:ring-2 focus:ring-error transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant">
            Confirme o nome do estudante <span className="text-error">*</span>
          </label>
          <p className="text-[11px] text-on-surface-variant mb-1">
            Digite exatamente: <span className="font-bold text-on-surface select-all">{student.name}</span>
          </p>
          <input
            type="text"
            value={banConfirmName}
            onChange={(e) => { setBanConfirmName(e.target.value); setError(""); }}
            placeholder="Nome completo do estudante"
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
              Termos e consequências do banimento
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
            <div ref={termsRef} className="px-4 py-4 bg-surface-container-lowest border-t border-outline-variant/20 max-h-64 overflow-y-auto">
              <div className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line space-y-3">
                {BAN_TERMS.split("\n\n").map((paragraph, i) => (
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
              Confirmo que os motivos informados são legítimos e documentados.
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
          disabled={loading || !agreed || !banReasons.trim() || banConfirmName.trim() !== student.name.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-error text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
          {loading ? "Aplicando banimento..." : "Confirmar Banimento"}
        </button>
      </div>
    </form>
  );
}
