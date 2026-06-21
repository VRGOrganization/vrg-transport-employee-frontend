"use client";

import { useEffect, useState } from "react";
import { Ban, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Student } from "@/types/student";
import type { BanlistEntry } from "@/types/banlist";
import { DAY_LABELS } from "@/types/cards.types";
import { banlistService } from "@/services/banlistService";

const DAY_ORDER = ["SEG", "TER", "QUA", "QUI", "SEX"] as const;

const PERIOD_STYLE: Record<string, string> = {
  "Manhã":    "bg-amber-50  text-amber-700  border-amber-200",
  "Tarde":    "bg-orange-50 text-orange-700 border-orange-200",
  "Noite":    "bg-violet-50 text-violet-700 border-violet-200",
  "Integral": "bg-teal-50   text-teal-700   border-teal-200",
};

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  colSpan?: boolean;
  badge?: React.ReactNode;
}

function InfoRow({ icon, label, value, colSpan, badge }: InfoRowProps) {
  return (
    <div className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm ${colSpan ? "md:col-span-2 flex justify-between items-center" : ""}`}>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>{icon}</span>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-on-surface font-medium ml-8">{value}</p>
      </div>
      {badge}
    </div>
  );
}

interface StudentInfoViewProps {
  student: Student;
  onClose: () => void;
  onBan?: () => void;
}

export function StudentInfoView({ student, onClose, onBan }: StudentInfoViewProps) {
  const [banHistory, setBanHistory] = useState<BanlistEntry[]>([]);

  useEffect(() => {
    banlistService
      .getByStudent(student._id)
      .then((entries) => {
        const sorted = [...entries].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setBanHistory(sorted);
      })
      .catch(() => {
        // endpoint unavailable — silently ignore
      });
  }, [student._id]);

  return (
    <>
      <div className="p-8 overflow-y-auto flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow icon="mail" label="E-mail" value={student.email} />
          <InfoRow icon="phone" label="Telefone" value={student.telephone || "Não informado"} />
          <InfoRow icon="account_balance" label="Instituição" value={student.institution || "Não informada"} />
          <InfoRow icon="schedule" label="Turno" value={student.shift || "Não informado"} />

          <InfoRow
            icon="calendar_today"
            label="Data de Cadastro"
            value={new Date(student.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric",
            })}
            colSpan
            badge={
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                student.active
                  ? "bg-success-container text-on-success"
                  : "bg-error-container text-on-error"
              }`}>
                {student.active ? "Ativo" : "Inativo"}
              </span>
            }
          />

          {/* ── Schedule grid ──────────────────────────────────────── */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm md:col-span-2 mt-2">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: "22px" }}>calendar_month</span>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Grade de Horários</p>
            </div>
            {student.schedule && student.schedule.length > 0 ? (() => {
              const byDay = DAY_ORDER.reduce((acc, d) => {
                acc[d] = (student.schedule ?? []).filter((s) => s.day === d);
                return acc;
              }, {} as Record<string, typeof student.schedule>);
              return (
                <div className="grid grid-cols-5 gap-3">
                  {DAY_ORDER.map((day) => {
                    const items = byDay[day] ?? [];
                    const active = items.length > 0;
                    return (
                      <div
                        key={day}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                          active
                            ? "bg-primary/5 border-primary/20 shadow-sm"
                            : "bg-surface-container-low/40 border-outline-variant/15"
                        }`}
                      >
                        <div className={`size-11 rounded-full flex items-center justify-center text-[11px] font-extrabold tracking-wider shrink-0 ${
                          active
                            ? "bg-primary text-on-primary shadow-md"
                            : "bg-surface-container-high text-on-surface-variant/35"
                        }`}>
                          {day}
                        </div>
                        <p className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
                          active ? "text-primary/60" : "text-on-surface-variant/30"
                        }`}>
                          {DAY_LABELS[day] ?? day}
                        </p>
                        <div className="flex flex-col gap-1 w-full mt-0.5">
                          {active
                            ? items.map((item, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-center border w-full ${
                                    PERIOD_STYLE[item.period] ?? "bg-surface-container text-on-surface-variant border-outline-variant"
                                  }`}
                                >
                                  {item.period}
                                </span>
                              ))
                            : <span className="text-[12px] text-on-surface-variant/25 text-center">—</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })() : (
              <p className="text-on-surface-variant text-sm bg-surface-container-low p-4 rounded-lg text-center border border-dashed border-outline-variant/40">
                O estudante não cadastrou nenhuma grade de horários.
              </p>
            )}
          </div>

          {/* ── Ban history ────────────────────────────────────────── */}
          {banHistory.length > 0 && (
            <div className="md:col-span-2 mt-2 rounded-xl border border-error/25 overflow-hidden shadow-sm">
              {/* Section header */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-error/5 border-b border-error/15">
                <ShieldAlert className="size-4 text-error shrink-0" />
                <p className="text-xs font-bold text-error uppercase tracking-wider flex-1">
                  Histórico de Banimentos
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20">
                  {banHistory.length} {banHistory.length === 1 ? "registro" : "registros"}
                </span>
              </div>

              {/* Entries */}
              <div className="divide-y divide-error/10 bg-surface-container-lowest">
                {banHistory.map((entry, idx) => (
                  <div key={entry._id} className="px-5 py-4">
                    {/* Entry header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                        entry.active ? "bg-error text-white" : "bg-surface-container-high text-on-surface-variant"
                      }`}>
                        {entry.active
                          ? <ShieldAlert className="size-3.5" />
                          : <ShieldCheck className="size-3.5" />
                        }
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        entry.active
                          ? "bg-error/10 text-error border-error/25"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                      }`}>
                        {entry.active ? "Banimento ativo" : "Banimento removido"}
                      </span>
                      <span className="ml-auto text-[11px] text-on-surface-variant">
                        {new Date(entry.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Ban reasons */}
                    <div className="ml-8 space-y-1.5">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        Motivo{entry.reasons.length > 1 ? "s" : ""} do banimento
                      </p>
                      {entry.reasons.map((reason, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm text-on-surface bg-error/5 border border-error/15 rounded-lg px-3 py-2"
                        >
                          <span className="text-error mt-0.5 shrink-0 text-xs font-bold">#{i + 1}</span>
                          <span className="text-on-surface-variant">{reason}</span>
                        </div>
                      ))}

                      {/* Unban info */}
                      {!entry.active && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-2">
                          {entry.unbannedAt && (
                            <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                              <ShieldCheck className="size-3.5 text-success shrink-0" />
                              Removido em{" "}
                              <span className="font-semibold text-on-surface">
                                {new Date(entry.unbannedAt).toLocaleDateString("pt-BR", {
                                  day: "2-digit", month: "short", year: "numeric",
                                })}
                              </span>
                            </p>
                          )}
                          {entry.unbanReasons && entry.unbanReasons.length > 0 && (
                            <>
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                                Motivo{entry.unbanReasons.length > 1 ? "s" : ""} do desbanimento
                              </p>
                              {entry.unbanReasons.map((reason, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 text-sm bg-success/5 border border-success/15 rounded-lg px-3 py-2"
                                >
                                  <span className="text-success mt-0.5 shrink-0 text-xs font-bold">#{i + 1}</span>
                                  <span className="text-on-surface-variant">{reason}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between gap-3 shrink-0">
        <div>
          {student.active && onBan && (
            <button
              onClick={onBan}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all text-error border border-error/30 hover:bg-error/8 hover:border-error/60 cursor-pointer"
            >
              <Ban className="size-4" />
              Banir
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all bg-surface-container-high hover:bg-surface-container-highest text-on-surface shadow-sm cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}
