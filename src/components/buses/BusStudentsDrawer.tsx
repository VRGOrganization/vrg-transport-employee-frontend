"use client";

import { useCallback, useEffect, useState } from "react";
import { busApi, universityApi } from "@/lib/universityApi";
import { http } from "@/services/http";
import { resolvePaginated, type Paginated } from "@/types/api";
import { getApprovedBusStudents } from "@/lib/busStudents";
import type { Bus, BusStudent } from "@/types/university.types";
import type {
  LicenseRecord,
  LicenseRequestRecord,
  StudentRecord,
} from "@/types/cards.types";
import { Modal } from "@/components/ui/Modal";
import { resolveDisplayName, toTitleCase } from "@/lib/utils/string";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AlertCircle, Bus as BusIcon, Check, Users, UserX, X } from "lucide-react";

interface Props {
  bus: Bus | null;
  onClose: () => void;
  /** Liberar vagas é exclusivo do admin no backend. */
  canReleaseSlots?: boolean;
}

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"] as const;
type Day = (typeof DAYS)[number];

const DAY_SHORT: Record<Day, string> = {
  SEG: "Seg",
  TER: "Ter",
  QUA: "Qua",
  QUI: "Qui",
  SEX: "Sex",
};

const SHIFT_LABELS: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
  full_time: "Integral",
};

function UniversitySection({
  label,
  students,
}: {
  label: string;
  students: BusStudent[];
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
          {label}
        </h4>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-muted">
          {students.length}
        </span>
      </div>
      {students.length === 0 ? (
        <p className="text-xs italic text-on-surface-muted pl-1">
          Nenhum aluno para esta faixa
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-full">
                  Nome
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="px-3 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center whitespace-nowrap w-12"
                  >
                    {DAY_SHORT[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {students.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-surface-container-low/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-on-surface truncate max-w-xs">
                      {toTitleCase(resolveDisplayName(student))}
                    </p>
                    <p className="text-xs text-on-surface-muted truncate">
                      {student.email}
                    </p>
                  </td>
                  {DAYS.map((day) => (
                    <td key={day} className="px-3 py-3 text-center">
                      {student.days?.includes(day) ? (
                        <Check className="size-4 text-success mx-auto" />
                      ) : (
                        <span className="text-on-surface-muted text-xs">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BusStudentsDrawer({ bus, onClose, canReleaseSlots = false }: Props) {
  const [students, setStudents] = useState<BusStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [universityCache, setUniversityCache] = useState<Record<string, string>>({});

  const loadStudents = useCallback(async (target: Bus) => {
    const [studentsRes, licensesRes, requestsRes] = await Promise.all([
      http.get<Paginated<StudentRecord>>("/student").then(resolvePaginated),
      http.get<Paginated<LicenseRecord>>("/license/all").then(resolvePaginated),
      http.get<Paginated<LicenseRequestRecord>>("/license-request").then(resolvePaginated),
    ]);
    return getApprovedBusStudents(studentsRes, licensesRes, requestsRes, target);
  }, []);

  useEffect(() => {
    if (!bus) return;
    setLoading(true);
    loadStudents(bus)
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [bus, loadStudents]);

  useEffect(() => {
    if (!bus) return;
    const ids: string[] = [];
    (bus.universitySlots ?? []).forEach((s) => {
      if (typeof s.universityId === "string") ids.push(s.universityId);
      else if (s.universityId?._id) ids.push(s.universityId._id);
    });
    (bus.universityIds ?? []).forEach((u: any) => {
      if (typeof u === "string") ids.push(u);
      else if (u?._id) ids.push(u._id);
    });
    const unique = Array.from(new Set(ids)).filter((i) => !!i && !universityCache[i]);
    if (unique.length === 0) return;
    Promise.all(
      unique.map((id) =>
        universityApi
          .getById(id)
          .then((u) => ({ id, acronym: u.acronym }))
          .catch(() => ({ id, acronym: id })),
      ),
    ).then((arr) => {
      const next = { ...universityCache };
      arr.forEach((r) => {
        next[r.id] = r.acronym;
      });
      setUniversityCache(next);
    });
  }, [bus, setUniversityCache]);

  const handleReleaseSlots = async () => {
    if (!bus) return;
    try {
      setActionLoading(true);
      setMessage("");
      await busApi.releaseSlots(bus._id, true);
      setMessage("Vagas liberadas com sucesso.");
      setLoading(true);
      const list = await loadStudents(bus);
      setStudents(list);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage(e?.message ?? "Erro ao liberar vagas.");
    } finally {
      setActionLoading(false);
      setLoading(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  function getAcronym(u: any) {
    if (!u) return "";
    const busSlots = bus?.universitySlots ?? [];
    const busUniversityIds = bus?.universityIds ?? [];
    if (typeof u === "string") {
      if (universityCache[u]) return universityCache[u];
      const found = busSlots.find(
        (s) => typeof s.universityId !== "string" && s.universityId._id === u,
      );
      if (found && typeof found.universityId !== "string")
        return found.universityId.acronym ?? u;
      const found2 = busUniversityIds.find(
        (x: any) => typeof x !== "string" && x._id === u,
      );
      if (found2 && typeof found2 !== "string") return found2.acronym ?? u;
      return u;
    }
    return u.acronym ?? u._id ?? "";
  }

  const busSlots = bus?.universitySlots ?? [];
  const busCapacity = bus?.capacity ?? null;
  const maxDailyOccupancy = students.length === 0
    ? 0
    : Math.max(...DAYS.map((day) => students.filter((s) => s.days?.includes(day)).length));

  const orderedSlots = busSlots
    .slice()
    .sort((a, b) => (a.priorityOrder ?? 0) - (b.priorityOrder ?? 0));

  const grouped = students.reduce(
    (acc, s) => {
      const key =
        typeof s.universityId === "string"
          ? s.universityId
          : (s.universityId?._id ?? "__unknown");
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    },
    {} as Record<string, BusStudent[]>,
  );

  const slotIds = new Set(
    orderedSlots.map((s) =>
      typeof s.universityId === "string" ? s.universityId : s.universityId._id,
    ),
  );
  const unmatchedStudents = students.filter((s) => {
    const key =
      typeof s.universityId === "string"
        ? s.universityId
        : (s.universityId?._id ?? "__unknown");
    return !slotIds.has(key);
  });

  return (
    <>
      <Modal
        open={!!bus}
        onClose={onClose}
        size="xl"
        closeOnBackdrop={false}
        hideClose
        noPadding
        header={
          bus ? (
            <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-low shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-info-container flex items-center justify-center">
                    <BusIcon className="text-info size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span>{bus.identifier}</span>
                      {bus.shift && (
                        <span className="px-2.5 py-1 rounded-full bg-primary text-on-primary text-xs font-semibold">
                          {SHIFT_LABELS[bus.shift] ?? bus.shift}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      {busCapacity == null
                        ? "Sem limite de vagas"
                        : `${loading ? "-" : maxDailyOccupancy} / ${busCapacity} vagas preenchidas (pico/dia)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canReleaseSlots && (
                    <button
                      onClick={() => setConfirmOpen(true)}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-lg bg-warning-container text-on-warning text-sm font-medium hover:bg-warning/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "Liberando..." : "Liberar vagas"}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
              {message && (
                <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
              )}
            </div>
          ) : null
        }
      >
        {bus && (
          <>
            {/* Summary bar */}
            <div className="px-6 pt-5 pb-4 border-b border-outline-variant/30">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                  <Users className="size-3.5 text-on-surface-muted" />
                  <span className="text-xs font-semibold text-on-surface">
                    {loading ? "-" : students.length} aluno
                    {students.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {DAYS.map((day) => {
                  const occupied = loading
                    ? null
                    : students.filter((s) => s.days?.includes(day)).length;
                  const free =
                    busCapacity != null && occupied != null
                      ? busCapacity - occupied
                      : null;
                  return (
                    <div
                      key={day}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/50 text-xs"
                    >
                      <span className="font-bold text-on-surface">
                        {DAY_SHORT[day]}
                      </span>
                      <span className="text-on-surface-muted mx-0.5">-</span>
                      {loading ? (
                        <span className="text-on-surface-muted">…</span>
                      ) : busCapacity == null ? (
                        <span className="text-on-surface-variant">
                          {occupied}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">
                          <span
                            className={
                              free === 0
                                ? "text-error font-semibold"
                                : "text-success font-semibold"
                            }
                          >
                            {occupied}
                          </span>
                          /{busCapacity}
                          {free != null && free > 0 && (
                            <span className="ml-1 text-success">
                              ({free} livres)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student table */}
            <div className="px-6 py-5">
              {loading ? (
                <div className="animate-pulse space-y-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i}>
                      <div className="h-4 bg-surface-container-high rounded w-24 mb-2" />
                      <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
                        <div className="h-9 bg-surface-container-low" />
                        {[...Array(3)].map((_, j) => (
                          <div
                            key={j}
                            className="h-12 border-t border-outline-variant/20 bg-surface-container-lowest"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-muted">
                  <UserX className="size-12 mb-3" />
                  <p className="text-sm font-medium text-on-surface-variant">
                    Nenhum aluno neste ônibus
                  </p>
                </div>
              ) : orderedSlots.length > 0 ? (
                <>
                  {orderedSlots.map((slot) => {
                    const sid =
                      typeof slot.universityId === "string"
                        ? slot.universityId
                        : slot.universityId._id;
                    const items = grouped[sid] ?? [];
                    return (
                      <UniversitySection
                        key={sid}
                        label={`P${slot.priorityOrder}: ${getAcronym(slot.universityId)}`}
                        students={items}
                      />
                    );
                  })}
                  {unmatchedStudents.length > 0 && (
                    <UniversitySection
                      label="Outros"
                      students={unmatchedStudents}
                    />
                  )}
                </>
              ) : (
                <UniversitySection label="Alunos" students={students} />
              )}
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await handleReleaseSlots();
        }}
        loading={actionLoading}
        title="Liberar vagas"
        description="Confirmar liberação de vagas para este ônibus? Alunos em fila serão promovidos automaticamente."
        icon={AlertCircle}
        variant="warning"
        confirmLabel="Liberar"
      />
    </>
  );
}
