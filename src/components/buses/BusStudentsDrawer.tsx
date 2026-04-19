"use client";

import { useEffect, useState } from "react";
import { busApi } from "@/lib/universityApi";
import type { Bus, BusStudent } from "@/types/university.types";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (!bus) return;
    setLoading(true);
    busApi
      .studentsByBusId(bus._id)
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [bus]);

  if (!bus) return null;

  const filledSlotsTotal = bus.filledSlotsTotal ?? students.length;

  const grouped = students.reduce((acc, s) => {
    const key = s.universityId ?? "__unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, BusStudent[]>);

  const orderedSlots = (bus.universitySlots ?? []).slice().sort((a, b) => (a.priorityOrder ?? 0) - (b.priorityOrder ?? 0));
  const unknownKey = "__unknown";
  const unknownStudents = grouped[unknownKey] ?? [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600" style={{ fontSize: "20px" }}>
                  directions_bus
                </span>
              </div>
                <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{bus.identifier}</span>
                  {bus.shift && (
                    <span className="text-xxs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {bus.shift}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">{bus.capacity == null ? "Sem limite" : `${filledSlotsTotal} / ${bus.capacity} vagas`}</p>
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
                    // reload students
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
                className="px-3 py-2 rounded-lg bg-amber-50 text-amber-800 text-sm"
              >
                {actionLoading ? "Liberando..." : "Liberar vagas"}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
          </div>
          {message && <div className="mt-2 text-sm text-slate-600">{message}</div>}

          {/* Faculdades vinculadas */}
          {(bus.universitySlots ?? []).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {orderedSlots.map((s) => (
                <span
                  key={typeof s.universityId === "string" ? s.universityId : s.universityId._id}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {typeof s.universityId === "string" ? s.universityId : s.universityId.acronym}
                  <span className="ml-2 text-xxs text-slate-400">P{s.priorityOrder}{s.filledSlots != null ? ` • ${s.filledSlots}` : ""}</span>
                </span>
              ))}
            </div>
          ) : (bus.universityIds ?? []).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(bus.universityIds ?? []).map((u) => (
                <span
                  key={typeof u === "string" ? u : u._id}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {typeof u === "string" ? u : u.acronym}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Contador */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "18px" }}>
              groups
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
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
                <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-600">
              <span className="material-symbols-outlined text-5xl mb-3">person_off</span>
              <p className="text-sm font-medium text-slate-400">Nenhum aluno neste ônibus</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedSlots.length > 0 ? (
                orderedSlots.map((slot) => {
                  const sid = typeof slot.universityId === "string" ? slot.universityId : slot.universityId._id;
                  const items = grouped[sid] ?? [];
                  return (
                    <div key={sid}>
                      <h4 className="text-xs font-medium text-slate-500 mb-2">P{slot.priorityOrder} — {typeof slot.universityId === "string" ? slot.universityId : slot.universityId.acronym} ({items.length})</h4>
                      {items.length > 0 ? (
                        <ul className="space-y-2">
                          {items.map((student) => (
                            <li
                              key={student._id}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                  {student.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{student.email}</p>
                              </div>
                              {student.shift && (
                                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                  {SHIFT_LABELS[student.shift] ?? student.shift}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic text-slate-400">Nenhum aluno para esta faixa</p>
                      )}
                    </div>
                  );
                })
              ) : null}

              {unknownStudents.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-2">Outros ({unknownStudents.length})</h4>
                  <ul className="space-y-2">
                    {unknownStudents.map((student) => (
                      <li
                        key={student._id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                            {student.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{student.email}</p>
                        </div>
                        {student.shift && (
                          <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
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