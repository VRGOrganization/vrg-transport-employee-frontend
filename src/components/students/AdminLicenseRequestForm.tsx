"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { DocumentUploadField } from "@/components/students/DocumentUploadField";
import { universityService } from "@/services/universityService";
import { busService } from "@/services/busService";
import {
  licenseRequestService,
  type AdminCreateLicenseRequestInput,
} from "@/services/licenseRequestService";
import { SHIFTS, BLOOD_TYPES } from "@/types/student";
import type { University, Bus } from "@/types/university.types";

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"] as const;
const PERIODS = ["Manhã", "Tarde", "Noite"] as const;

interface AdminLicenseRequestFormProps {
  studentId: string;
  studentName?: string;
  onSuccess?: (requestId: string) => void;
}

/**
 * Formulário interno de criação de pedido de carteirinha (admin/funcionário).
 * Espelha o fluxo do aluno, mas: faculdade/curso são texto (autocomplete), com
 * opção de criar faculdade temporária; o ônibus é escolhido manualmente. O
 * pedido gerado segue as regras normais (fila/prioridade).
 */
export function AdminLicenseRequestForm({
  studentId,
  studentName,
  onSuccess,
}: AdminLicenseRequestFormProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);

  const [institution, setInstitution] = useState("");
  const [universityId, setUniversityId] = useState<string>("");
  const [degree, setDegree] = useState("");
  const [shift, setShift] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [busId, setBusId] = useState("");
  const [transportMode, setTransportMode] = useState<"regular" | "weekly">("regular");
  const [schedule, setSchedule] = useState<Array<{ day: string; period: string }>>([]);
  const [documents, setDocuments] = useState<Record<string, File | null>>({});

  const [creatingTemp, setCreatingTemp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    universityService.list().then(setUniversities).catch(() => {});
    busService.listActive().then(setBuses).catch(() => {});
  }, []);

  // Ao digitar/selecionar a faculdade, resolve o universityId se casar com a lista.
  useEffect(() => {
    const match = universities.find(
      (u) => u.name.toLowerCase() === institution.trim().toLowerCase(),
    );
    setUniversityId(match?._id ?? "");
  }, [institution, universities]);

  // Faculdade já com ônibus vinculado: mostra só os vinculados. Faculdade
  // nova/sem vínculo ainda: cai de volta para a lista completa de ativos.
  const busOptions = useMemo(() => {
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
  }, [buses, universityId]);

  const isSelected = (day: string, period: string) =>
    schedule.some((s) => s.day === day && s.period === period);

  const toggleSlot = (day: string, period: string) => {
    setSchedule((prev) =>
      isSelected(day, period)
        ? prev.filter((s) => !(s.day === day && s.period === period))
        : [...prev, { day, period }],
    );
  };

  const handleCreateTemporary = async () => {
    const name = institution.trim();
    if (!name) {
      setError("Digite o nome da faculdade antes de criar a temporária.");
      return;
    }
    setCreatingTemp(true);
    setError("");
    try {
      const created = await universityService.createTemporary(name);
      setUniversities((prev) => [...prev, created]);
      setInstitution(created.name);
      setUniversityId(created._id);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Erro ao criar faculdade temporária.");
    } finally {
      setCreatingTemp(false);
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

      {/* ── Instituição ─────────────────────────────────────────────── */}
      <section className="space-y-4 rounded-xl border border-outline-variant p-4">
        <h3 className="text-sm font-bold text-on-surface">Instituição e curso</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
              Faculdade
            </label>
            <input
              list="admin-universities-datalist"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Digite ou selecione a faculdade"
              className="w-full h-14 bg-surface-container-lowest border border-on-surface-variant focus:ring-2 focus:ring-primary rounded-xl text-on-surface px-4 text-base outline-none"
            />
            <datalist id="admin-universities-datalist">
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
                    onClick={handleCreateTemporary}
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
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Turno"
            icon="schedule"
            options={SHIFTS}
            placeholder="Selecione o turno"
            value={shift}
            onChange={(e) => setShift(e.target.value)}
          />
          <SelectField
            label="Tipo Sanguíneo"
            options={BLOOD_TYPES.map((bt) => ({ value: bt, label: bt }))}
            placeholder="Não informado"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
          />
        </div>
      </section>

      {/* ── Horário ─────────────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-outline-variant p-4">
        <h3 className="text-sm font-bold text-on-surface">Grade de horários</h3>
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
                  {PERIODS.map((period) => (
                    <td key={period} className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected(day, period)}
                        onChange={() => toggleSlot(day, period)}
                        className="size-4 accent-primary cursor-pointer"
                        aria-label={`${day} ${period}`}
                      />
                    </td>
                  ))}
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
            placeholder="Selecione o ônibus"
            value={busId}
            onChange={(e) => setBusId(e.target.value)}
          />
          <SelectField
            label="Modo de transporte"
            options={[
              { value: "regular", label: "Regular" },
              { value: "weekly", label: "Semanal" },
            ]}
            value={transportMode}
            onChange={(e) => setTransportMode(e.target.value as "regular" | "weekly")}
          />
        </div>
      </section>

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
