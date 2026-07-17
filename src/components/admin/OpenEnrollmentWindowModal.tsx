"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { universityService } from "@/services/universityService";
import type { University } from "@/types/university.types";
import type { EnrollmentWindowEligibilityScope } from "@/types/enrollmentPeriod";

export interface OpenEnrollmentWindowFormPayload {
  startDate: string;
  endDate: string;
  eligibilityScope: EnrollmentWindowEligibilityScope;
  eligibleUniversityIds?: string[];
}

interface OpenEnrollmentWindowModalProps {
  open: boolean;
  loading: boolean;
  serverError: string;
  onClose: () => void;
  onSubmit: (payload: OpenEnrollmentWindowFormPayload) => Promise<void>;
}

interface FormErrors {
  startDate: string;
  endDate: string;
  eligibleUniversityIds: string;
}

const EMPTY_ERRORS: FormErrors = {
  startDate: "",
  endDate: "",
  eligibleUniversityIds: "",
};

const SCOPE_OPTIONS: Array<{
  value: EnrollmentWindowEligibilityScope;
  label: string;
  description: string;
}> = [
  {
    value: "all",
    label: "Todos os alunos",
    description: "Qualquer aluno pode enviar solicitação nessa janela.",
  },
  {
    value: "has_university",
    label: "Só alunos com faculdade cadastrada",
    description: "Exclui alunos sem faculdade vinculada ao cadastro.",
  },
  {
    value: "specific_universities",
    label: "Faculdades específicas",
    description: "Restringe a uma ou mais faculdades escolhidas abaixo.",
  },
];

function optionItemClass(selected: boolean): string {
  const base =
    "flex items-start gap-3 w-full px-4 py-3 rounded-xl text-sm border transition-all cursor-pointer";
  return `${base} ${
    selected
      ? "border-primary bg-primary/10 text-primary"
      : "border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/40"
  }`;
}

export function OpenEnrollmentWindowModal({
  open,
  loading,
  serverError,
  onClose,
  onSubmit,
}: OpenEnrollmentWindowModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eligibilityScope, setEligibilityScope] =
    useState<EnrollmentWindowEligibilityScope>("all");
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<string[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [universitiesError, setUniversitiesError] = useState("");
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  // Reseta o form a cada abertura sem efeito — ajuste de estado durante o
  // render, guardado pela comparação com prevOpen (padrão recomendado pelo
  // React pra "resetar estado quando uma prop muda").
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStartDate("");
      setEndDate("");
      setEligibilityScope("all");
      setSelectedUniversityIds([]);
      setErrors(EMPTY_ERRORS);
    }
  }

  useEffect(() => {
    if (!open) return;
    const mountState = { cancelled: false };

    const load = async () => {
      setUniversitiesLoading(true);
      setUniversitiesError("");
      try {
        const data = await universityService.list();
        if (!mountState.cancelled) {
          setUniversities(data.filter((u) => u.active));
        }
      } catch {
        if (!mountState.cancelled) {
          setUniversitiesError("Não foi possível carregar as faculdades.");
        }
      } finally {
        if (!mountState.cancelled) setUniversitiesLoading(false);
      }
    };

    void load();
    return () => {
      mountState.cancelled = true;
    };
  }, [open]);

  const toggleUniversity = (universityId: string) => {
    setSelectedUniversityIds((prev) =>
      prev.includes(universityId)
        ? prev.filter((id) => id !== universityId)
        : [...prev, universityId],
    );
    setErrors((prev) => ({ ...prev, eligibleUniversityIds: "" }));
  };

  const validate = (): OpenEnrollmentWindowFormPayload | null => {
    const nextErrors: FormErrors = { ...EMPTY_ERRORS };

    if (!startDate) nextErrors.startDate = "Data de início é obrigatória.";
    if (!endDate) nextErrors.endDate = "Data de fim é obrigatória.";

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      if (end <= start) {
        nextErrors.endDate = "Data de fim deve ser maior que a data de início.";
      }
    }

    if (
      eligibilityScope === "specific_universities" &&
      selectedUniversityIds.length === 0
    ) {
      nextErrors.eligibleUniversityIds =
        "Selecione ao menos uma faculdade.";
    }

    const hasErrors = Object.values(nextErrors).some((value) => value.length > 0);
    setErrors(nextErrors);
    if (hasErrors) return null;

    return {
      startDate: `${startDate}T00:00:00.000Z`,
      endDate: `${endDate}T23:59:59.999Z`,
      eligibilityScope,
      ...(eligibilityScope === "specific_universities"
        ? { eligibleUniversityIds: selectedUniversityIds }
        : {}),
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = validate();
    if (!payload) return;
    await onSubmit(payload);
  };

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} size="lg" title="Abrir janela de inscrição">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="window-start-date" className="mb-0.5 block text-sm font-medium text-on-surface">
              Data de início
            </label>
            <input
              id="window-start-date"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setErrors((prev) => ({ ...prev, startDate: "", endDate: "" }));
              }}
              className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.startDate && <p className="mt-1 text-xs text-error">{errors.startDate}</p>}
          </div>
          <div>
            <label htmlFor="window-end-date" className="mb-0.5 block text-sm font-medium text-on-surface">
              Data de fim
            </label>
            <input
              id="window-end-date"
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setErrors((prev) => ({ ...prev, endDate: "" }));
              }}
              className="h-9 w-full rounded-lg border border-on-surface-variant bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.endDate && <p className="mt-1 text-xs text-error">{errors.endDate}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-on-surface">
            Quem pode participar
          </label>
          <div className="space-y-2">
            {SCOPE_OPTIONS.map((option) => {
              const selected = eligibilityScope === option.value;
              return (
                <label key={option.value} className={optionItemClass(selected)}>
                  <input
                    type="radio"
                    name="eligibilityScope"
                    value={option.value}
                    checked={selected}
                    onChange={() => {
                      setEligibilityScope(option.value);
                      setErrors((prev) => ({ ...prev, eligibleUniversityIds: "" }));
                    }}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span
                      className={`block text-xs ${
                        selected ? "text-primary/80" : "text-on-surface-variant"
                      }`}
                    >
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {eligibilityScope === "specific_universities" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-on-surface">Faculdades</label>
            {universitiesLoading ? (
              <p className="text-sm text-on-surface-variant">Carregando faculdades...</p>
            ) : universitiesError ? (
              <p className="text-sm text-error">{universitiesError}</p>
            ) : universities.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Nenhuma faculdade cadastrada.</p>
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-low p-2">
                {universities.map((university) => {
                  const selected = selectedUniversityIds.includes(university._id);
                  return (
                    <label
                      key={university._id}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm border transition-all cursor-pointer ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleUniversity(university._id)}
                        className="accent-primary"
                      />
                      <span>
                        {university.acronym} — {university.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {errors.eligibleUniversityIds && (
              <p className="mt-1 text-xs text-error">{errors.eligibleUniversityIds}</p>
            )}
          </div>
        )}

        {serverError && (
          <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Abrir janela
          </Button>
        </div>
      </form>
    </Modal>
  );
}
