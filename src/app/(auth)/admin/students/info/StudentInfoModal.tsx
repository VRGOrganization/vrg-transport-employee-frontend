"use client";

import { useEffect, useState, useRef } from "react";
import { Student } from "@/types/student";
import { DAY_LABELS } from "@/types/cards.types";
import { banlistService } from "@/services/banlistService";
import { getInitials } from "@/lib/utils/string";
import { Ban, Loader2, AlertCircle, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";

// ─── Ban terms text ───────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "info" | "ban-form";

interface StudentInfoModalProps {
  student: Student;
  onClose: () => void;
  onEdit?: () => void;
  onBanned?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentInfoModal({ student, onClose, onEdit, onBanned }: StudentInfoModalProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("info");

  const [banReasons, setBanReasons] = useState("");
  const [banConfirmName, setBanConfirmName] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [banError, setBanError] = useState("");
  const [banSuccess, setBanSuccess] = useState(false);

  const [termsOpen, setTermsOpen] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const termsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  if (!mounted) return null;

  const handleOpenTerms = () => {
    setTermsOpen((prev) => !prev);
    setHasReadTerms(true);
  };

  const handleBanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banReasons.trim()) {
      setBanError("Informe o motivo do banimento.");
      return;
    }
    if (banConfirmName.trim() !== student.name.trim()) {
      setBanError("O nome de confirmação não confere com o nome do estudante.");
      return;
    }
    if (!agreed) {
      setBanError("Você deve ler e concordar com os termos antes de continuar.");
      return;
    }

    setBanLoading(true);
    setBanError("");
    try {
      await banlistService.ban(student._id, [banReasons.trim()]);
      setBanSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setBanError(error.message ?? "Erro ao banir o estudante. Tente novamente.");
    } finally {
      setBanLoading(false);
    }
  };

  const handleBanClose = () => {
    if (banSuccess && onBanned) {
      onBanned();
    } else {
      onClose();
    }
  };

  const resetBanForm = () => {
    setView("info");
    setBanReasons("");
    setBanConfirmName("");
    setBanError("");
    setBanSuccess(false);
    setAgreed(false);
    setTermsOpen(false);
    setHasReadTerms(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-3xl mx-4 bg-surface rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

        {/* ── SHARED HEADER ──────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-primary to-primary-container px-6 py-8 flex flex-col items-center justify-center relative shrink-0">
          <button
            onClick={view === "ban-form" ? handleBanClose : onClose}
            className="absolute top-4 right-4 text-on-primary hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>

          <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center shadow-lg border-4 border-surface mb-4">
            <span className="text-3xl font-bold text-primary">
              {getInitials(student.name)}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-on-primary tracking-tight text-center">
            {student.name}
          </h2>
          <p className="text-on-primary/80 text-sm mt-1">
            {student.active ? "Estudante Ativo" : "Estudante Inativo"} no Sistema
          </p>
        </div>

        {/* ── INFO VIEW ──────────────────────────────────────────────── */}
        {view === "info" && (
          <>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>mail</span>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">E-mail</p>
                  </div>
                  <p className="text-on-surface font-medium ml-8">{student.email}</p>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>phone</span>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Telefone</p>
                  </div>
                  <p className="text-on-surface font-medium ml-8">{student.telephone || "Não informado"}</p>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>account_balance</span>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Instituição</p>
                  </div>
                  <p className="text-on-surface font-medium ml-8">{student.institution || "Não informada"}</p>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>schedule</span>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Turno</p>
                  </div>
                  <p className="text-on-surface font-medium ml-8 capitalize">{student.shift || "Não informado"}</p>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm md:col-span-2 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>calendar_today</span>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Data de Cadastro</p>
                    </div>
                    <p className="text-on-surface font-medium ml-8">
                      {new Date(student.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                    student.active
                      ? "bg-success-container text-on-success"
                      : "bg-error-container text-on-error"
                  }`}>
                    {student.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm md:col-span-2 mt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "22px" }}>calendar_month</span>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Grade de Horários</p>
                  </div>
                  {student.schedule && student.schedule.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {student.schedule.map((item, index) => (
                        <span
                          key={`${item.day}-${item.period}-${index}`}
                          className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span>
                          {DAY_LABELS[item.day] ?? item.day} · {item.period}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-on-surface-variant text-sm bg-surface-container-low p-4 rounded-lg text-center border border-dashed border-outline-variant/40">
                      O estudante não cadastrou nenhuma grade de horários.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between gap-3 shrink-0">
              <div>
                {student.active && (
                  <button
                    onClick={() => setView("ban-form")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all text-error border border-error/30 hover:bg-error/8 hover:border-error/60"
                  >
                    <Ban className="w-4 h-4" />
                    Banir
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all bg-surface-container-high hover:bg-surface-container-highest text-on-surface shadow-sm"
                >
                  Fechar
                </button>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all bg-primary text-on-primary hover:opacity-90 shadow-sm"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                    Editar
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── BAN FORM VIEW ──────────────────────────────────────────── */}
        {view === "ban-form" && (
          <>
            {banSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                  <Ban className="w-8 h-8 text-error" />
                </div>
                <div>
                  <p className="text-xl font-bold text-on-surface">Banimento aplicado</p>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
                    O estudante <span className="font-semibold text-on-surface">{student.name}</span> foi
                    banido do sistema. Todas as suas sessões foram encerradas.
                  </p>
                </div>
                <button
                  onClick={handleBanClose}
                  className="mt-2 px-6 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-sm transition-all"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleBanSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-error/5 border border-error/20">
                    <ShieldAlert className="w-5 h-5 text-error shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-error">Ação reversível imediata</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Ao confirmar, o estudante perderá acesso ao sistema imediatamente. O banimento pode
                        ser removido posteriormente por um administrador.
                      </p>
                    </div>
                  </div>

                  {banError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-error-container/60 text-error text-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {banError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant">
                      Motivo do banimento <span className="text-error">*</span>
                    </label>
                    <textarea
                      value={banReasons}
                      onChange={(e) => { setBanReasons(e.target.value); setBanError(""); }}
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
                      onChange={(e) => { setBanConfirmName(e.target.value); setBanError(""); }}
                      placeholder="Nome completo do estudante"
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-on-surface-variant text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-error focus:border-error transition-all"
                    />
                  </div>

                  <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={handleOpenTerms}
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-surface-container-low hover:bg-surface-container transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "18px" }}>
                          gavel
                        </span>
                        Termos e consequências do banimento
                        {!hasReadTerms && (
                          <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20">
                            Leitura obrigatória
                          </span>
                        )}
                      </span>
                      {termsOpen
                        ? <ChevronUp className="w-4 h-4 text-on-surface-variant shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
                      }
                    </button>

                    {termsOpen && (
                      <div
                        ref={termsRef}
                        className="px-4 py-4 bg-surface-container-lowest border-t border-outline-variant/20 max-h-64 overflow-y-auto"
                      >
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
                    onClick={() => { setAgreed(!agreed); setBanError(""); }}
                    className={`group w-full flex items-start text-left gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                      !hasReadTerms
                        ? "border-outline-variant/20 bg-surface-container-lowest opacity-60 cursor-not-allowed"
                        : agreed
                          ? "border-error bg-error/5 ring-4 ring-error/10 hover:bg-error/10"
                          : "border-outline-variant/40 bg-surface hover:border-error/40 hover:shadow-md hover:bg-surface-container-lowest"
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
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
                    onClick={resetBanForm}
                    disabled={banLoading}
                    className="flex-1 px-4 py-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={banLoading || !agreed || !banReasons.trim() || banConfirmName.trim() !== student.name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-error text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {banLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Ban className="w-4 h-4" />
                    }
                    {banLoading ? "Aplicando banimento..." : "Confirmar Banimento"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
