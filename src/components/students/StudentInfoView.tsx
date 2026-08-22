"use client";

import { useEffect, useState } from "react";
import { Ban, ShieldAlert } from "lucide-react";
import type { Student } from "@/types/student";
import type { BanHistoryEntry } from "@/types/banlist";
import { DAY_LABELS } from "@/types/cards.types";
import { banlistService } from "@/services/banlistService";
import { BanHistoryModal } from "./BanHistoryModal";
import { transportUsageService } from "@/services/transportUsageService";
import { imageService } from "@/services/imageService";
import { normalizeMediaSource } from "@/lib/cardUtils";
import { getInitials, resolveDisplayName, toTitleCase } from "@/lib/utils/string";

const DAY_ORDER = ["SEG", "TER", "QUA", "QUI", "SEX"] as const;

const PERIOD_STYLE: Record<string, string> = {
  "Manhã":    "bg-amber-50  text-amber-700  border-amber-200",
  "Tarde":    "bg-orange-50 text-orange-700 border-orange-200",
  "Noite":    "bg-violet-50 text-violet-700 border-violet-200",
  "Integral": "bg-teal-50   text-teal-700   border-teal-200",
};

interface StatTileProps {
  icon: string;
  label: string;
  value: string;
  emphasize?: boolean;
}

function StatTile({ icon, label, value, emphasize }: StatTileProps) {
  return (
    <div
      className={
        emphasize
          ? "bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 shadow-sm min-w-0"
          : "bg-surface-container-low/60 px-3 py-2 rounded-lg min-w-0"
      }
    >
      <div className={`flex items-center gap-1.5 ${emphasize ? "mb-1" : "mb-0.5"}`}>
        <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: emphasize ? "18px" : "14px" }}>
          {icon}
        </span>
        <p className={`font-bold text-on-surface-variant uppercase tracking-wider truncate ${emphasize ? "text-[11px]" : "text-[10px]"}`}>
          {label}
        </p>
      </div>
      <p className={`text-on-surface font-medium truncate ${emphasize ? "text-sm" : "text-xs"}`}>{value}</p>
    </div>
  );
}

interface StudentInfoViewProps {
  student: Student;
  onClose: () => void;
  onBan?: () => void;
}

export function StudentInfoView({ student, onClose, onBan }: StudentInfoViewProps) {
  const [banHistory, setBanHistory] = useState<BanHistoryEntry[]>([]);
  const [banHistoryOpen, setBanHistoryOpen] = useState(false);
  const [banHistoryLoading, setBanHistoryLoading] = useState(true);
  const [banHistoryError, setBanHistoryError] = useState("");
  const [alreadyUsesTransport, setAlreadyUsesTransport] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    // O backend já devolve em ordem cronológica (mais antigo primeiro) com os
    // nomes dos admins resolvidos; o modal cuida da apresentação. O estado já
    // nasce em "carregando", então só escrevemos no retorno da chamada.
    banlistService
      .getHistory(student._id)
      .then((entries) => {
        setBanHistory(entries);
        setBanHistoryError("");
      })
      .catch(() => setBanHistoryError("Não foi possível carregar o histórico de banimentos."))
      .finally(() => setBanHistoryLoading(false));

    transportUsageService
      .getByStudent(student._id)
      .then((decl) => setAlreadyUsesTransport(decl.alreadyUsesTransport))
      .catch(() => {
        // endpoint unavailable — silently ignore
      });

    imageService
      .getByStudent(student._id)
      .then((images) => {
        const profile = images.find((img) => img.photoType === "ProfilePhoto" && img.active);
        setProfilePhoto(profile?.photo3x4 ?? null);
      })
      .catch(() => {
        // endpoint unavailable / aluno sem foto enviada — mantém as iniciais
      });
  }, [student._id]);

  const displayName = toTitleCase(resolveDisplayName(student));
  const photoSrc = normalizeMediaSource(profilePhoto);
  const registrationDate = new Date(student.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 flex flex-col lg:flex-row gap-6">
          {/* ── Identity column ────────────────────────────────────── */}
          <div className="lg:w-48 shrink-0 flex flex-col items-center text-center lg:sticky lg:top-0">
            <div className="size-24 rounded-full shadow-md border-4 border-surface bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {photoSrc ? (
                <img src={photoSrc} alt={displayName} className="size-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">{getInitials(displayName)}</span>
              )}
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-on-surface leading-tight break-words">
              {displayName}
            </h2>
            <span
              className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                student.active
                  ? "bg-success-container text-on-success"
                  : "bg-error-container text-on-error"
              }`}
            >
              {student.active ? "Ativo" : "Inativo"}
            </span>

            {/* Só aparece para quem já foi banido alguma vez. */}
            {banHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setBanHistoryOpen(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-error/30 text-error text-xs font-semibold hover:bg-error/8 hover:border-error/60 transition-colors cursor-pointer"
              >
                <ShieldAlert className="size-4 shrink-0" />
                <span>Histórico de banimentos</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-error/10 border border-error/20">
                  {banHistory.length}
                </span>
              </button>
            )}
          </div>

          {/* ── Details column ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Important stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatTile icon="bloodtype" label="Tipo Sanguíneo" value={student.bloodType || "Não informado"} emphasize />
              <StatTile icon="phone" label="Telefone" value={student.telephone || "Não informado"} emphasize />
              <StatTile icon="account_balance" label="Instituição" value={student.institution ? toTitleCase(student.institution) : "Não informada"} emphasize />
            </div>

            {/* E-mail — own row, room to show the full address without truncating */}
            <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: "18px" }}>mail</span>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">E-mail</p>
              </div>
              <p className="text-on-surface font-medium text-sm break-all">{student.email}</p>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatTile icon="schedule" label="Turno" value={student.shift || "—"} />
              <StatTile icon="directions_bus" label="Já Usa Transporte" value={alreadyUsesTransport ? "Sim" : "Não"} />
              <StatTile icon="accessible" label="PCD" value={student.hasDisability ? "Sim" : "Não"} />
              <StatTile icon="calendar_today" label="Cadastro" value={registrationDate} />
            </div>

            {/* Schedule grid */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>calendar_month</span>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Grade de Horários</p>
              </div>
              {student.schedule && student.schedule.length > 0 ? (() => {
                const byDay = DAY_ORDER.reduce((acc, d) => {
                  acc[d] = (student.schedule ?? []).filter((s) => s.day === d);
                  return acc;
                }, {} as Record<string, typeof student.schedule>);
                return (
                  <div className="grid grid-cols-5 gap-2.5">
                    {DAY_ORDER.map((day) => {
                      const items = byDay[day] ?? [];
                      const active = items.length > 0;
                      return (
                        <div
                          key={day}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                            active
                              ? "bg-primary/5 border-primary/20 shadow-sm"
                              : "bg-surface-container-low/40 border-outline-variant/15"
                          }`}
                        >
                          <div className={`size-10 rounded-full flex items-center justify-center text-xs font-extrabold tracking-wider shrink-0 ${
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
                              : <span className="text-[11px] text-on-surface-variant/25 text-center">—</span>
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
          </div>
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

      {/* Segundo modal: linha do tempo dos banimentos deste aluno. */}
      <BanHistoryModal
        open={banHistoryOpen}
        studentName={displayName}
        history={banHistory}
        loading={banHistoryLoading}
        error={banHistoryError}
        onClose={() => setBanHistoryOpen(false)}
      />
    </>
  );
}
