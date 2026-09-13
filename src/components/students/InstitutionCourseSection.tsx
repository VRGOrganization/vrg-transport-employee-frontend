"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/Input";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { SHIFTS } from "@/types/student";
import type { University } from "@/types/university.types";
import {
  SCHEDULE_PERIODS,
  isFullTimeShift,
  isPeriodAllowedForShift,
} from "@/lib/shiftRules";

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"] as const;
const PERIODS = SCHEDULE_PERIODS;

export interface ScheduleSlot {
  day: string;
  period: string;
}

interface InstitutionCourseSectionProps {
  /** Título da subseção "Instituição e curso". */
  title: string;
  /** Prefixo único para evitar colisão de ids (datalist) entre instâncias. */
  idPrefix: string;

  universities: University[];

  institution: string;
  onInstitutionChange: (value: string) => void;
  /** universityId já resolvido pela faculdade digitada (vazio = não cadastrada). */
  universityId: string;
  institutionPlaceholder?: string;

  degree: string;
  onDegreeChange: (value: string) => void;
  /** aria-label do campo curso (para acessibilidade/testes). */
  degreeAriaLabel?: string;

  shift: string;
  onShiftChange: (value: string) => void;
  /** aria-label do campo turno (para acessibilidade/testes). */
  shiftAriaLabel?: string;

  schedule: ScheduleSlot[];
  onToggleSlot: (day: string, period: string) => void;
  /** sufixo do aria-label dos checkboxes da grade (ex.: " (2ª)"). */
  scheduleAriaSuffix?: string;

  busOptions: SelectOption[];
  busId: string;
  onBusChange: (value: string) => void;
  busAriaLabel?: string;
  /** Erro inline abaixo do seletor de ônibus (ex.: campo obrigatório). */
  busError?: string;

  /** Erro inline abaixo do título da grade de horários (ex.: nenhum horário selecionado). */
  scheduleError?: string;

  onCreateTemporary: () => void;
  creatingTemp: boolean;

  /** Campos extras dentro da seção "Instituição e curso" (ex.: tipo sanguíneo). */
  extraInstitutionFields?: ReactNode;
  /** Campos extras dentro da seção "Ônibus e transporte" (ex.: modo de transporte). */
  extraTransportFields?: ReactNode;
  /** Campos de documento (comprovantes) desta faculdade — renderizados numa
   *  subseção "Documentos" própria do bloco. */
  documentFields?: ReactNode;
}

/**
 * Bloco reutilizável de instituição/curso + grade de horários + ônibus.
 * Serve tanto para a matrícula PRIMÁRIA quanto para a SECUNDÁRIA, evitando
 * duplicar a lógica de datalist de faculdade, link de faculdade temporária,
 * grade de horários e seletor de ônibus.
 */
export function InstitutionCourseSection({
  title,
  idPrefix,
  universities,
  institution,
  onInstitutionChange,
  universityId,
  institutionPlaceholder = "Digite ou selecione a faculdade",
  degree,
  onDegreeChange,
  degreeAriaLabel,
  shift,
  onShiftChange,
  shiftAriaLabel,
  schedule,
  onToggleSlot,
  scheduleAriaSuffix = "",
  busOptions,
  busId,
  onBusChange,
  busAriaLabel,
  busError,
  scheduleError,
  onCreateTemporary,
  creatingTemp,
  extraInstitutionFields,
  extraTransportFields,
  documentFields,
}: InstitutionCourseSectionProps) {
  const datalistId = `${idPrefix}-universities-datalist`;
  const isSelected = (day: string, period: string) =>
    schedule.some((s) => s.day === day && s.period === period);

  // Turno é o pré-requisito da grade e do ônibus: sem ele não há como saber
  // quais períodos/ônibus são válidos, então os dois ficam bloqueados.
  const shiftSelected = Boolean(shift);
  const isPeriodAllowed = (period: string) => isPeriodAllowedForShift(period, shift);

  return (
    <>
      {/* ── Instituição ─────────────────────────────────────────────── */}
      <section className="space-y-4 rounded-xl border border-outline-variant p-4">
        <h3 className="text-sm font-bold text-on-surface">{title}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
              Faculdade
            </label>
            <input
              list={datalistId}
              value={institution}
              onChange={(e) => onInstitutionChange(e.target.value)}
              placeholder={institutionPlaceholder}
              className="w-full h-14 bg-surface-container-lowest border border-on-surface-variant focus:ring-2 focus:ring-primary rounded-xl text-on-surface px-4 text-base outline-none"
            />
            <datalist id={datalistId}>
              {universities.map((u) => (
                <option key={u._id} value={u.name} />
              ))}
            </datalist>
            <div className="flex items-center gap-2 text-xs">
              {universityId ? (
                <span className="text-primary">Faculdade cadastrada vinculada.</span>
              ) : (
                <>
                  <span className="text-outline">Não cadastrada.</span>
                  <button
                    type="button"
                    onClick={onCreateTemporary}
                    disabled={creatingTemp}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    {creatingTemp ? "Criando…" : "Criar faculdade temporária"}
                  </button>
                </>
              )}
            </div>
          </div>

          <Input
            label="Curso / Graduação"
            type="text"
            icon="school"
            placeholder="Ex: Engenharia de Software"
            aria-label={degreeAriaLabel}
            value={degree}
            onChange={(e) => onDegreeChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField
            label="Turno"
            icon="schedule"
            options={SHIFTS}
            placeholder="Selecione o turno"
            aria-label={shiftAriaLabel}
            value={shift}
            onChange={(e) => onShiftChange(e.target.value)}
          />
          {extraInstitutionFields}
        </div>
      </section>

      {/* ── Horário ─────────────────────────────────────────────────── */}
      {/* Cada checkbox carrega seu próprio `disabled` — aqui só o realce visual
          de que a grade ainda não está liberada. */}
      <section
        className={`space-y-3 rounded-xl border border-outline-variant p-4 ${
          shiftSelected ? "" : "opacity-60"
        }`}
      >
        <h3 className="text-sm font-bold text-on-surface">Grade de horários</h3>
        <p className="text-xs text-on-surface-variant -mt-1">
          {!shiftSelected
            ? "Selecione o turno para liberar a grade de horários."
            : isFullTimeShift(shift)
              ? "Turno Integral: todos os períodos liberados."
              : `Turno ${shift}: apenas horários do período ${shift.toLowerCase()}.`}
        </p>
        {scheduleError && <p className="text-xs text-error -mt-1">{scheduleError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-on-surface-variant"></th>
                {PERIODS.map((p) => (
                  <th key={p} className="p-2 text-center text-on-surface-variant font-medium">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="p-2 font-bold text-on-surface">{day}</td>
                  {PERIODS.map((period) => {
                    const allowed = isPeriodAllowed(period);
                    return (
                      <td key={period} className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected(day, period)}
                          disabled={!allowed}
                          onChange={() => onToggleSlot(day, period)}
                          className="size-4 accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`${day} ${period}${scheduleAriaSuffix}`}
                          title={
                            shiftSelected
                              ? allowed
                                ? undefined
                                : `Indisponível para o turno ${shift}.`
                              : "Selecione o turno primeiro."
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Ônibus e transporte ─────────────────────────────────────── */}
      <section className="space-y-4 rounded-xl border border-outline-variant p-4">
        <h3 className="text-sm font-bold text-on-surface">Ônibus e transporte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Ônibus (seleção manual)"
            icon="directions_bus"
            options={busOptions}
            disabled={!shiftSelected}
            placeholder={
              shiftSelected
                ? busOptions.length > 0
                  ? "Selecione o ônibus"
                  : "Nenhum ônibus para este turno"
                : "Selecione o turno primeiro"
            }
            aria-label={busAriaLabel}
            value={busId}
            onChange={(e) => onBusChange(e.target.value)}
            error={busError}
          />
          {extraTransportFields}
        </div>
        <p className="text-xs text-on-surface-variant">
          {!shiftSelected
            ? "Selecione o turno para liberar a lista de ônibus."
            : universityId
              ? "Mostrando ônibus vinculados à faculdade e do turno selecionado."
              : "Faculdade não cadastrada: mostrando todos os ônibus do turno selecionado."}
        </p>
      </section>

      {/* ── Documentos desta faculdade ──────────────────────────────────── */}
      {documentFields && (
        <section className="space-y-4 rounded-xl border border-outline-variant p-4">
          <h3 className="text-sm font-bold text-on-surface">Documentos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {documentFields}
          </div>
        </section>
      )}
    </>
  );
}
