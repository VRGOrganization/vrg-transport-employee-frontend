"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

interface AdminLicenseRequestFormProps {
  studentId: string;
  studentName?: string;
  onSuccess?: (requestId: string) => void;
}

/** Opções de ônibus para uma faculdade: prioriza os vinculados, cai para todos. */
function buildBusOptions(buses: Bus[], universityId: string) {
  const linked = (bus: Bus) =>
    (bus.universitySlots ?? []).some((s) => {
      const id = typeof s.universityId === "string" ? s.universityId : s.universityId?._id;
      return id === universityId;
    });
  const linkedBuses = buses.filter(linked);
  const list = linkedBuses.length > 0 ? linkedBuses : buses;
  return list.map((bus) => ({
    value: bus._id,
    label: `${bus.identifier}${linked(bus) ? " • vinculado" : ""}`,
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
 * pedido gerado segue as regras normais (fila/prioridade).
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
  const [success, setSuccess] = useState<string | null>(null);

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
    () => buildBusOptions(buses, universityId),
    [buses, universityId],
  );
  const secondaryBusOptions = useMemo(
    () => buildBusOptions(buses, secondaryUniversityId),
    [buses, secondaryUniversityId],
  );

  const makeToggleSlot =
    (setState: React.Dispatch<React.SetStateAction<ScheduleSlot[]>>) =>
    (day: string, period: string) => {
      setState((prev) =>
        prev.some((s) => s.day === day && s.period === period)
          ? prev.filter((s) => !(s.day === day && s.period === period))
          : [...prev, { day, period }],
      );
    };

  const toggleSlot = useCallback(makeToggleSlot(setSchedule), []);
  const toggleSecondarySlot = useCallback(makeToggleSlot(setSecondarySchedule), []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!busId) {
      setError("Selecione um ônibus para o pedido.");
      return;
    }
    if (schedule.length === 0) {
      setError("Selecione ao menos um horário.");
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
    }

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
    try {
      const result = await licenseRequestService.adminCreate(payload);
      setSuccess(result.requestId);
      onSuccess?.(result.requestId);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Erro ao criar o pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <StatusBanner variant="success">
        Pedido criado com sucesso e adicionado à fila (id {success}).
      </StatusBanner>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        schedule={schedule}
        onToggleSlot={toggleSlot}
        busOptions={busOptions}
        busId={busId}
        onBusChange={setBusId}
        busAriaLabel="Ônibus (seleção manual)"
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
        />
      )}

      {/* ── Documentos ──────────────────────────────────────────────── */}
      <section className="space-y-4 rounded-xl border border-outline-variant p-4">
        <h3 className="text-sm font-bold text-on-surface">Documentos (opcional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ["ProfilePhoto", "Foto 3x4"],
              ["EnrollmentProof", "Comprovante de matrícula"],
              ["CourseSchedule", "Grade horária"],
              ["AcademicPeriodProof", "Comprovante de período letivo"],
            ] as const
          ).map(([key, label]) => (
            <DocumentUploadField
              key={key}
              label={label}
              value={documents[key] ?? null}
              onChange={(file) => setDocuments((prev) => ({ ...prev, [key]: file }))}
            />
          ))}
        </div>
      </section>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Criar pedido de carteirinha
      </Button>
    </form>
  );
}
