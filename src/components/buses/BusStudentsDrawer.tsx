"use client";

import { useEffect, useState } from "react";
import { busApi, universityApi } from "@/lib/universityApi";
import type { Bus, BusStudent } from "@/types/university.types";
import { Bus as BusIcon, Users, UserX, X } from "lucide-react";

interface Props {
  bus: Bus | null;
  onClose: () => void;
}

const SHIFT_LABELS: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
  full_time: "Integral",
};

export function BusStudentsDrawer({ bus, onClose }: Props) {
  const [students, setStudents] = useState<BusStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [universityCache, setUniversityCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!bus) return;
    setLoading(true);
    busApi
      .studentsByBusId(bus._id)
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [bus]);

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
    Promise.all(unique.map((id) => universityApi.getById(id).then((u) => ({ id, acronym: u.acronym })).catch(() => ({ id, acronym: id }))))
      .then((arr) => {
        const next = { ...universityCache };
        arr.forEach((r) => { next[r.id] = r.acronym; });
        setUniversityCache(next);
      });
  }, [bus, setUniversityCache]);

  if (!bus) return null;

  const busSlots = bus.universitySlots ?? [];
  const busUniversityIds = bus.universityIds ?? [];
  const filledSlotsTotal = bus.filledSlotsTotal ?? students.length;

  const grouped = students.reduce((acc, s) => {
    const key =
      typeof s.universityId === "string"
        ? s.universityId
        : (s.universityId?._id ?? "__unknown");
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, BusStudent[]>);

  const orderedSlots = busSlots
    .slice()
    .sort((a, b) => (a.priorityOrder ?? 0) - (b.priorityOrder ?? 0));
  const unknownKey = "__unknown";
  const unknownStudents = grouped[unknownKey] ?? [];

  function getAcronym(u: any) {
    if (!u) return "";
    if (typeof u === "string") {
      if (universityCache[u]) return universityCache[u];
      const found = busSlots.find(
        (s) => typeof s.universityId !== "string" && s.universityId._id === u
      );
      if (found && typeof found.universityId !== "string") return found.universityId.acronym ?? u;
      const found2 = busUniversityIds.find((x: any) => typeof x !== "string" && x._id === u);
      if (found2 && typeof found2 !== "string") return found2.acronym ?? u;
      return u;
    }
    return u.acronym ?? u._id ?? "";
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface-container-lowest shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info-container flex items-center justify-center">
                <BusIcon className="text-info h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span>{bus.identifier}</span>
                  {bus.shift && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                      {bus.shift}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-on-surface-variant">{bus.capacity == null ? "Sem limite" : `${filledSlotsTotal} / ${bus.capacity} vagas`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!bus) return;
                  const ok = window.confirm("Confirmar liberação de vagas para este ônibus? (promoverá automaticamente alunos em fila)");
                  if (!ok) return;
                  try {
                    setActionLoading(true);
                    setMessage("");
                    await busApi.releaseSlots(bus._id, true);
                    setMessage("Vagas liberadas com sucesso.");
                    setLoading(true);
                    const list = await busApi.studentsByBusId(bus._id);
                    setStudents(list);
                  } catch (err: any) {
                    setMessage(err?.message ?? "Erro ao liberar vagas.");
                  } finally {
                    setActionLoading(false);
                    setLoading(false);
                    setTimeout(() => setMessage(""), 4000);
                  }
                }}
                disabled={actionLoading}
                className="px-3 py-2 rounded-lg bg-warning-container text-on-warning text-sm"
              >
                {actionLoading ? "Liberando..." : "Liberar vagas"}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {message && <div className="mt-2 text-sm text-on-surface-variant">{message}</div>}

          {/* Faculdades vinculadas */}
          {(bus.universitySlots ?? []).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {orderedSlots.map((s) => (
                <span
                  key={typeof s.universityId === "string" ? s.universityId : s.universityId._id}
                  className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs font-medium text-on-surface-variant"
                >
                  {getAcronym(s.universityId)}
                  <span className="ml-2 text-[10px] text-on-surface-muted">P{s.priorityOrder}{s.filledSlots != null ? ` • ${s.filledSlots}` : ""}</span>
                </span>
              ))}
            </div>
          ) : (bus.universityIds ?? []).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(bus.universityIds ?? []).map((u) => (
                <span
                  key={typeof u === "string" ? u : u._id}
                  className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs font-medium text-on-surface-variant"
                >
                  {getAcronym(u)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Contador */}
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <Users className="text-on-surface-muted h-4 w-4" />
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface text-base">
                {loading ? "—" : students.length}
              </span>
              {" "}aluno{students.length !== 1 ? "s" : ""} cadastrado{students.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container-high animate-pulse" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-muted">
              <UserX className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium text-on-surface-variant">Nenhum aluno neste ônibus</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedSlots.length > 0 ? (
                orderedSlots.map((slot) => {
                  const sid = typeof slot.universityId === "string" ? slot.universityId : slot.universityId._id;
                  const items = grouped[sid] ?? [];
                  return (
                    <div key={sid}>
                      <h4 className="text-xs font-medium text-on-surface-variant mb-2">P{slot.priorityOrder} — {getAcronym(slot.universityId)} ({items.length})</h4>
                      {items.length > 0 ? (
                        <ul className="space-y-2">
                          {items.map((student) => (
                            <li
                              key={student._id}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant"
                            >
                              <div className="w-8 h-8 rounded-full bg-info-container flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-info">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-on-surface truncate">{student.name}</p>
                                <p className="text-xs text-on-surface-muted truncate">{student.email}</p>
                              </div>
                              {student.shift && (
                                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                                  {SHIFT_LABELS[student.shift] ?? student.shift}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic text-on-surface-muted">Nenhum aluno para esta faixa</p>
                      )}
                    </div>
                  );
                })
              ) : null}

              {unknownStudents.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-on-surface-variant mb-2">Outros ({unknownStudents.length})</h4>
                  <ul className="space-y-2">
                    {unknownStudents.map((student) => (
                      <li
                        key={student._id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant"
                      >
                        <div className="w-8 h-8 rounded-full bg-info-container flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-info">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{student.name}</p>
                          <p className="text-xs text-on-surface-muted truncate">{student.email}</p>
                        </div>
                        {student.shift && (
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                            {SHIFT_LABELS[student.shift] ?? student.shift}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
