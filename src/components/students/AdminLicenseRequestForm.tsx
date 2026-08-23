"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { DocumentUploadField } from "@/components/students/DocumentUploadField";
import {
  InstitutionCourseSection,
  type ScheduleSlot,
} from "@/components/students/InstitutionCourseSection";
import { universityService } from "@/services/universityService";
import { busService } from "@/services/busService";
import {
  licenseRequestService,
  type AdminCreateLicenseRequestInput,
} from "@/services/licenseRequestService";
import { BLOOD_TYPES } from "@/types/student";
import type { University, Bus } from "@/types/university.types";
import {
  SCHEDULE_PERIODS,
  busMatchesShift,
  filterScheduleByShift,
  isPeriodAllowedForShift,
} from "@/lib/shiftRules";

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"] as const;
const PERIODS = SCHEDULE_PERIODS;

const DOCUMENT_FIELDS = [
  ["ProfilePhoto", "Foto 3x4", "Foto recente, rosto visível, fundo neutro. JPG, PNG ou WEBP."],
  ["EnrollmentProof", "Comprovante de matrícula", "Documento da faculdade confirmando matrícula ativa."],
  ["CourseSchedule", "Grade horária", "Grade de horários das aulas no período atual."],
  ["AcademicPeriodProof", "Comprovante de período letivo", "Confirma o período/semestre letivo em curso."],
] as const;

const SECONDARY_DOCUMENT_FIELDS = [
  ["SecondaryEnrollmentProof", "Comprovante de matrícula"],
  ["SecondaryCourseSchedule", "Grade horária"],
  ["SecondaryAcademicPeriodProof", "Comprovante de período letivo"],
] as const;

interface AdminLicenseRequestFormProps {
  studentId: string;
  studentName?: string;
  onSuccess?: (requestId: string) => void;
}

/**
 * Opções de ônibus, aplicando em ordem os dois filtros da regra de negócio:
 *
 * 1. TURNO (obrigatório): sem turno escolhido a lista fica vazia — o campo só é
 *    liberado depois da escolha. Com turno, só entram ônibus daquele turno
 *    (`Integral` aceita todos; ônibus sem turno definido nunca são escondidos).
 * 2. FACULDADE (quando cadastrada): dentro do turno, prioriza os ônibus
 *    vinculados àquela faculdade. Faculdade não cadastrada (ou sem ônibus
 *    vinculado no turno) lista todos os ônibus do turno.
 */
function buildBusOptions(buses: Bus[], universityId: string, shift: string) {
  if (!shift) return [];

  const linked = (bus: Bus) =>
    (bus.universitySlots ?? []).some((s) => {
      const id = typeof s.universityId === "string" ? s.universityId : s.universityId?._id;
      return id === universityId;
    });

  const shiftBuses = buses.filter((bus) => busMatchesShift(bus, shift));
  const linkedBuses = universityId ? shiftBuses.filter(linked) : [];
  const list = linkedBuses.length > 0 ? linkedBuses : shiftBuses;

  return list.map((bus) => ({
    value: bus._id,
    label: `${bus.identifier}${bus.shift ? ` • ${bus.shift}` : ""}${
      universityId && linked(bus) ? " • vinculado" : ""
    }`,
  }));
}

/** Resolve o universityId a partir do nome digitado (casa com a lista). */
function resolveUniversityId(universities: University[], name: string) {
  const match = universities.find(
    (u) => u.name.toLowerCase() === name.trim().toLowerCase(),
  );
  return match?._id ?? "";
}

/**
 * Formulário interno de criação de pedido de carteirinha (admin/funcionário).
 * Espelha o fluxo do aluno, mas: faculdade/curso são texto (autocomplete), com
 * opção de criar faculdade temporária; o ônibus é escolhido manualmente. O
 * pedido gerado segue as regras normais (fila/prioridade). Antes de enviar, o
 * funcionário revisa um resumo do pedido e confirma.
 *
 * Suporta alunos com uma SEGUNDA matrícula (2ª instituição/curso) com grade e
 * ônibus próprios, ativada por um toggle opcional.
 */
export function AdminLicenseRequestForm({
  studentId,
  studentName,
  onSuccess,
}: AdminLicenseRequestFormProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);

  // ── Matrícula primária ──────────────────────────────────────────────
  const [institution, setInstitution] = useState("");
  const [universityId, setUniversityId] = useState<string>("");
  const [degree, setDegree] = useState("");
  const [shift, setShift] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [busId, setBusId] = useState("");
  const [transportMode, setTransportMode] = useState<"regular" | "weekly">("regular");
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);

  // ── Matrícula secundária (opcional) ─────────────────────────────────
  const [secondaryEnabled, setSecondaryEnabled] = useState(false);
  const [secondaryInstitution, setSecondaryInstitution] = useState("");
  const [secondaryUniversityId, setSecondaryUniversityId] = useState<string>("");
  const [secondaryDegree, setSecondaryDegree] = useState("");
  const [secondaryShift, setSecondaryShift] = useState("");
  const [secondaryBusId, setSecondaryBusId] = useState("");
  const [secondarySchedule, setSecondarySchedule] = useState<ScheduleSlot[]>([]);

  const [documents, setDocuments] = useState<Record<string, File | null>>({});

  const [creatingTemp, setCreatingTemp] = useState(false);
  const [creatingTempSecondary, setCreatingTempSecondary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busIdError, setBusIdError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  // Só sinaliza que o pedido foi criado — o id fica com o `onSuccess`, que é
  // quem precisa dele; a tela não expõe o id ao funcionário.
  const [success, setSuccess] = useState(false);
  const [view, setView] = useState<"form" | "review">("form");

  useEffect(() => {
    universityService.list().then(setUniversities).catch(() => {});
    busService.listActive().then(setBuses).catch(() => {});
  }, []);

  // Ao digitar/selecionar a faculdade, resolve o universityId se casar com a lista.
  useEffect(() => {
    setUniversityId(resolveUniversityId(universities, institution));
  }, [institution, universities]);

  useEffect(() => {
    setSecondaryUniversityId(resolveUniversityId(universities, secondaryInstitution));
  }, [secondaryInstitution, universities]);

  const busOptions = useMemo(
    () => buildBusOptions(buses, universityId, shift),
    [buses, universityId, shift],
  );
  const secondaryBusOptions = useMemo(
    () => buildBusOptions(buses, secondaryUniversityId, secondaryShift),
    [buses, secondaryUniversityId, secondaryShift],
  );

  // Trocar o turno invalida escolhas feitas no turno anterior: horários fora do
  // novo turno saem da grade e o ônibus volta a vazio se não atender ao turno.
  // Sem isso o pedido poderia ser enviado com dados incoerentes (ex.: turno
  // Noite com horários da manhã).
  useEffect(() => {
    setSchedule((prev) => {
      const next = filterScheduleByShift(prev, shift);
      return next.length === prev.length ? prev : next;
    });
  }, [shift]);

  useEffect(() => {
    setSecondarySchedule((prev) => {
      const next = filterScheduleByShift(prev, secondaryShift);
      return next.length === prev.length ? prev : next;
    });
  }, [secondaryShift]);

  useEffect(() => {
    setBusId((prev) => (prev && !busOptions.some((o) => o.value === prev) ? "" : prev));
  }, [busOptions]);

  useEffect(() => {
    setSecondaryBusId((prev) =>
      prev && !secondaryBusOptions.some((o) => o.value === prev) ? "" : prev,
    );
  }, [secondaryBusOptions]);

  // A grade só aceita períodos permitidos pelo turno — a UI já bloqueia os
  // checkboxes, mas a guarda impede qualquer caminho inconsistente.
  const toggleSlot = useCallback(
    (day: string, period: string) => {
      if (!isPeriodAllowedForShift(period, shift)) return;
      setSchedule((prev) =>
        prev.some((s) => s.day === day && s.period === period)
          ? prev.filter((s) => !(s.day === day && s.period === period))
          : [...prev, { day, period }],
      );
      setScheduleError((prev) => (prev ? "" : prev));
    },
    [shift],
  );

  const toggleSecondarySlot = useCallback(
    (day: string, period: string) => {
      if (!isPeriodAllowedForShift(period, secondaryShift)) return;
      setSecondarySchedule((prev) =>
        prev.some((s) => s.day === day && s.period === period)
          ? prev.filter((s) => !(s.day === day && s.period === period))
          : [...prev, { day, period }],
      );
    },
    [secondaryShift],
  );

  const handleBusChange = (value: string) => {
    setBusId(value);
    setBusIdError((prev) => (prev ? "" : prev));
  };

  const createTemporary = async (
    name: string,
    setInst: (v: string) => void,
    setUniId: (v: string) => void,
    setBusy: (v: boolean) => void,
  ) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Digite o nome da faculdade antes de criar a temporária.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await universityService.createTemporary(trimmed);
      setUniversities((prev) => [...prev, created]);
      setInst(created.name);
      setUniId(created._id);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Erro ao criar faculdade temporária.");
    } finally {
      setBusy(false);
    }
  };

  /** Renderiza um campo de upload ligado ao estado `documents` pela chave (PhotoType). */
  const docField = (key: string, label: string, hint?: string) => (
    <DocumentUploadField
      key={key}
      label={label}
      hint={hint}
      // A foto 3x4 vira a imagem da carteirinha na license-api, que só aceita
      // JPEG/PNG/WEBP — PDF aqui só falharia na geração.
      imageOnly={key === "ProfilePhoto"}
      value={documents[key] ?? null}
      onChange={(file) => setDocuments((prev) => ({ ...prev, [key]: file }))}
    />
  );

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusIdError("");
    setScheduleError("");

    // Turno é pré-requisito da grade e do ônibus — valida antes dos dois para a
    // mensagem apontar a causa raiz em vez de dois erros derivados.
    if (!shift) {
      setError("Escolha o turno do aluno antes de continuar.");
      return;
    }

    let hasFieldError = false;
    if (!busId) {
      setBusIdError("Selecione um ônibus para o pedido.");
      hasFieldError = true;
    }
    if (schedule.length === 0) {
      setScheduleError("Selecione ao menos um horário na grade abaixo.");
      hasFieldError = true;
    }
    if (hasFieldError) return;

    // Documentos são obrigatórios: foto 3x4 + os 3 comprovantes da 1ª faculdade.
    if (
      !documents.ProfilePhoto ||
      !documents.EnrollmentProof ||
      !documents.CourseSchedule ||
      !documents.AcademicPeriodProof
    ) {
      setError(
        "Anexe a foto 3x4 e os comprovantes da 1ª faculdade (matrícula, grade horária e período letivo).",
      );
      return;
    }

    if (secondaryEnabled) {
      if (!secondaryInstitution.trim()) {
        setError("Informe a segunda faculdade ou desative a segunda instituição.");
        return;
      }
      if (!secondaryDegree.trim()) {
        setError("Informe o curso da segunda instituição.");
        return;
      }
      if (!secondaryShift) {
        setError("Selecione o turno da segunda instituição.");
        return;
      }
      if (secondarySchedule.length === 0) {
        setError("Selecione ao menos um horário para a segunda instituição.");
        return;
      }
      if (!secondaryBusId) {
        setError("Selecione um ônibus para a segunda instituição.");
        return;
      }
      const clash = secondarySchedule.find((s) =>
        schedule.some((p) => p.day === s.day && p.period === s.period),
      );
      if (clash) {
        setError(
          `Colisão de horário entre a grade primária e a secundária em ${clash.day} ${clash.period}. Ajuste as grades para não coincidirem.`,
        );
        return;
      }
      if (
        !documents.SecondaryEnrollmentProof ||
        !documents.SecondaryCourseSchedule ||
        !documents.SecondaryAcademicPeriodProof
      ) {
        setError(
          "Anexe os comprovantes da 2ª faculdade (matrícula, grade horária e período letivo).",
        );
        return;
      }
    }

    setView("review");
  };

  const handleConfirmCreate = async () => {
    const payload: AdminCreateLicenseRequestInput = {
      studentId,
      universityId: universityId || undefined,
      busId,
      institution: institution.trim() || undefined,
      degree: degree.trim() || undefined,
      shift: shift || undefined,
      bloodType: bloodType || undefined,
      schedule,
      transportMode,
      documents,
    };

    if (secondaryEnabled) {
      payload.secondaryUniversityId = secondaryUniversityId || undefined;
      payload.secondaryInstitution = secondaryInstitution.trim() || undefined;
      payload.secondaryDegree = secondaryDegree.trim() || undefined;
      payload.secondaryShift = secondaryShift || undefined;
      payload.secondaryBusId = secondaryBusId;
      payload.secondarySchedule = secondarySchedule;
    }

    setLoading(true);
    setError("");
    try {
      const result = await licenseRequestService.adminCreate(payload);
      setSuccess(true);
      onSuccess?.(result.requestId);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Erro ao criar o pedido.");
      setView("form");
    } finally {
      setLoading(false);
    }
  };

  const scheduleToSummary = (slots: ScheduleSlot[]) =>
    DAYS.flatMap((day) =>
      PERIODS.filter((period) => slots.some((s) => s.day === day && s.period === period)).map(
        (period) => `${day} ${period}`,
      ),
    );

  const busLabel = busOptions.find((b) => b.value === busId)?.label ?? busId;
  const secondaryBusLabel =
    secondaryBusOptions.find((b) => b.value === secondaryBusId)?.label ?? secondaryBusId;
  const scheduleSummary = scheduleToSummary(schedule);
  const secondaryScheduleSummary = scheduleToSummary(secondarySchedule);
  const attachedDocs = [
    ...DOCUMENT_FIELDS,
    ...(secondaryEnabled ? SECONDARY_DOCUMENT_FIELDS : []),
  ].filter(([key]) => documents[key]);

  if (success) {
    return (
      <StatusBanner variant="success">
        Pedido criado com sucesso e adicionado à fila.
      </StatusBanner>
    );
  }

  if (view === "review") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView("form")}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h3 className="font-headline font-semibold text-lg text-on-surface flex-1">
            Revisar pedido
          </h3>
        </div>

        {error && <StatusBanner variant="error">{error}</StatusBanner>}

        <p className="text-sm text-on-surface-variant">
          Confira os dados antes de criar o pedido{studentName ? ` de ${studentName}` : ""}.
        </p>

        <dl className="rounded-xl border border-outline-variant divide-y divide-outline-variant overflow-hidden">
          {[
            ["Faculdade", institution.trim() || "—"],
            ["Curso", degree.trim() || "—"],
            ["Turno", shift || "—"],
            ["Tipo sanguíneo", bloodType || "—"],
            ["Ônibus", busLabel || "—"],
            ["Modo de transporte", transportMode === "weekly" ? "Semanal" : "Regular"],
            ["Horários", scheduleSummary.length > 0 ? scheduleSummary.join(", ") : "—"],
            ...(secondaryEnabled
              ? ([
                  ["Faculdade (2ª)", secondaryInstitution.trim() || "—"],
                  ["Curso (2ª)", secondaryDegree.trim() || "—"],
                  ["Turno (2ª)", secondaryShift || "—"],
                  ["Ônibus (2ª)", secondaryBusLabel || "—"],
                  [
                    "Horários (2ª)",
                    secondaryScheduleSummary.length > 0
                      ? secondaryScheduleSummary.join(", ")
                      : "—",
                  ],
                ] as const)
              : []),
            [
              "Documentos anexados",
              attachedDocs.length > 0
                ? attachedDocs.map(([key, label]) => `${label} (${documents[key]!.name})`).join(", ")
                : "Nenhum documento anexado",
            ],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-3 grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</dt>
              <dd className="text-sm text-on-surface">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex gap-3">
          <Button variant="outline" size="lg" fullWidth onClick={() => setView("form")} disabled={loading}>
            Voltar e editar
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<Check className="size-4" />}
            onClick={() => void handleConfirmCreate()}
          >
            Confirmar e criar pedido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} className="space-y-6">
      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      {studentName && (
        <p className="text-sm text-on-surface-variant">
          Criando pedido de carteirinha para <strong>{studentName}</strong>.
        </p>
      )}

      {/* ── Matrícula primária ───────────────────────────────────────── */}
      <InstitutionCourseSection
        title="Instituição e curso"
        idPrefix="admin"
        universities={universities}
        institution={institution}
        onInstitutionChange={setInstitution}
        universityId={universityId}
        degree={degree}
        onDegreeChange={setDegree}
        shift={shift}
        onShiftChange={setShift}
        shiftAriaLabel="Turno"
        schedule={schedule}
        onToggleSlot={toggleSlot}
        scheduleError={scheduleError}
        busOptions={busOptions}
        busId={busId}
        onBusChange={handleBusChange}
        busAriaLabel="Ônibus (seleção manual)"
        busError={busIdError}
        onCreateTemporary={() =>
          createTemporary(institution, setInstitution, setUniversityId, setCreatingTemp)
        }
        creatingTemp={creatingTemp}
        extraInstitutionFields={
          <SelectField
            label="Tipo Sanguíneo"
            options={BLOOD_TYPES.map((bt) => ({ value: bt, label: bt }))}
            placeholder="Não informado"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
          />
        }
        extraTransportFields={
          <SelectField
            label="Modo de transporte"
            options={[
              { value: "regular", label: "Regular" },
              { value: "weekly", label: "Semanal" },
            ]}
            value={transportMode}
            onChange={(e) => setTransportMode(e.target.value as "regular" | "weekly")}
          />
        }
        documentFields={
          <>
            {DOCUMENT_FIELDS.filter(([key]) => key !== "ProfilePhoto").map(([key, label, hint]) =>
              docField(key, label, hint),
            )}
          </>
        }
      />

      {/* ── Toggle da segunda instituição ────────────────────────────── */}
      <label className="flex items-center gap-3 rounded-xl border border-outline-variant p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={secondaryEnabled}
          onChange={(e) => setSecondaryEnabled(e.target.checked)}
          className="size-4 accent-primary cursor-pointer"
          aria-label="Aluno cursa em segunda instituição"
        />
        <span className="text-sm font-bold text-on-surface">
          Aluno cursa em segunda instituição
        </span>
      </label>

      {/* ── Matrícula secundária (opcional) ──────────────────────────── */}
      {secondaryEnabled && (
        <InstitutionCourseSection
          title="Segunda instituição e curso"
          idPrefix="admin-secondary"
          universities={universities}
          institution={secondaryInstitution}
          onInstitutionChange={setSecondaryInstitution}
          universityId={secondaryUniversityId}
          institutionPlaceholder="Digite ou selecione a segunda faculdade"
          degree={secondaryDegree}
          onDegreeChange={setSecondaryDegree}
          degreeAriaLabel="Curso / Graduação (2ª)"
          shift={secondaryShift}
          onShiftChange={setSecondaryShift}
          shiftAriaLabel="Turno (2ª)"
          schedule={secondarySchedule}
          onToggleSlot={toggleSecondarySlot}
          scheduleAriaSuffix=" (2ª)"
          busOptions={secondaryBusOptions}
          busId={secondaryBusId}
          onBusChange={setSecondaryBusId}
          busAriaLabel="Ônibus (2ª)"
          onCreateTemporary={() =>
            createTemporary(
              secondaryInstitution,
              setSecondaryInstitution,
              setSecondaryUniversityId,
              setCreatingTempSecondary,
            )
          }
          creatingTemp={creatingTempSecondary}
          documentFields={
            <>
              {SECONDARY_DOCUMENT_FIELDS.map(([key, label]) => docField(key, label))}
            </>
          }
        />
      )}

      {/* ── Documento compartilhado do aluno (única foto para as duas faculdades) ── */}
      <section className="space-y-4 rounded-xl border border-outline-variant p-4">
        <h3 className="text-sm font-bold text-on-surface">Documento do aluno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(() => {
            const [key, label, hint] = DOCUMENT_FIELDS.find(([k]) => k === "ProfilePhoto")!;
            return docField(key, label, hint);
          })()}
        </div>
      </section>

      <Button type="submit" variant="primary" size="lg" fullWidth>
        Revisar pedido
      </Button>
    </form>
  );
}
