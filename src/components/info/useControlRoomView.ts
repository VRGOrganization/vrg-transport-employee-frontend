"use client";

import { useMemo } from "react";
import type { InfoSnapshot } from "@/services/infoService";
import type {
  Census,
  CycleFunnel,
  CycleSummary,
  Grid,
  GridTotals,
  InfoLens,
  Seat,
  UniversityView,
  BusLoad,
  FrequencyBucket,
  Day,
} from "@/types/info.types";
import { DAYS, PERIODS } from "@/types/info.types";
import { buildSeats } from "@/lib/info/buildSeats";
import { applyLens } from "@/lib/info/lens";
import {
  byBus,
  byUniversity,
  cycleFunnel,
  dayOverlap,
  frequencyProfile,
  gridByDayPeriod,
  gridTotals,
  licensesByCycle,
} from "@/lib/info/selectors";
import { buildReadout, contextLabelsFromLens, type ReadoutToken } from "@/lib/info/readout";
import { busLabel } from "@/lib/info/palette";
import type { FilterOption } from "./FilterPopover";

export interface ControlRoomView {
  /** Lente com o ciclo resolvido (o ativo, quando a URL não traz nenhum). */
  effectiveLens: InfoLens;
  cycles: CycleSummary[];
  selectedCycle: CycleSummary | null;
  seats: Seat[];
  lensedSeats: Seat[];
  grid: Grid;
  totals: GridTotals;
  frequency: FrequencyBucket[];
  overlap: Record<Day, Record<Day, number>>;
  fleet: BusLoad[];
  institutions: UniversityView;
  funnel: CycleFunnel;
  census: Census;
  readout: ReadoutToken[];
  universityOptions: FilterOption[];
  courseOptions: FilterOption[];
  busOptions: FilterOption[];
  shiftOptions: FilterOption[];
  failures: string[];
  /** `true` quando o ciclo selecionado não registrou nenhuma solicitação. */
  cycleIsEmpty: boolean;
  /** `true` quando o recorte atual não devolve nenhum aluno. */
  lensIsEmpty: boolean;
  /**
   * Vagas por (ônibus × dia), somadas entre faculdades. Só preenchido no ciclo
   * ativo — `filledSlots` zera no reset do ciclo.
   */
  capacityByBusDay: Map<string, { filled: number; capacity: number | null }>;
  /** `true` quando o ciclo selecionado é o ativo. */
  isActiveCycle: boolean;
}

const EMPTY_VIEW_CENSUS: Census = {
  studentsActive: 0,
  studentsInactive: 0,
  studentsPending: 0,
  studentsActiveStatus: 0,
  studentsExpired: 0,
  employeesActive: 0,
  employeesInactive: 0,
};

/**
 * Deriva TUDO que a página mostra a partir do snapshot e da lente.
 *
 * Só a troca de ciclo muda o conjunto de pedidos considerado — e mesmo ela é
 * uma redução em memória, porque `GET /license-request` já trouxe todos os
 * ciclos. Nenhum filtro dispara requisição.
 */
export function useControlRoomView(
  snapshot: InfoSnapshot | null,
  lens: InfoLens,
): ControlRoomView {
  // ── Ciclos ────────────────────────────────────────────────────────────────
  const cycles = useMemo<CycleSummary[]>(() => {
    if (!snapshot) return [];
    const licenses = licensesByCycle(snapshot.requests);
    return snapshot.cycles
      .map((cycle) => ({
        cycleId: cycle._id,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        cycleStartDate: cycle.cycleStartDate,
        status:
          cycle.status ?? (cycle.active ? ("active" as const) : ("closed" as const)),
        resetScheduledFor: cycle.resetScheduledFor ?? null,
        // Ciclo sem nenhuma solicitação é ciclo com zero — a linha aparece.
        licenses: licenses.get(cycle._id) ?? 0,
      }))
      .sort(
        (a, b) =>
          Date.parse(b.cycleStartDate) - Date.parse(a.cycleStartDate) ||
          a.cycleId.localeCompare(b.cycleId),
      );
  }, [snapshot]);

  const effectiveLens = useMemo<InfoLens>(() => {
    if (lens.cycleId) return lens;
    // Sem ciclo na URL, a lente aponta para o ativo; se não houver ativo, o
    // mais recente — a página nunca fica sem recorte temporal.
    const fallback =
      snapshot?.activeCycleId ??
      cycles.find((c) => c.status === "active")?.cycleId ??
      cycles[0]?.cycleId ??
      null;
    return { ...lens, cycleId: fallback };
  }, [lens, snapshot?.activeCycleId, cycles]);

  const selectedCycle =
    cycles.find((c) => c.cycleId === effectiveLens.cycleId) ?? null;

  /** Contadores vivos do ônibus só valem no ciclo ativo (zeram no reset). */
  const isActiveCycle = selectedCycle?.status === "active";

  // ── Pedidos do ciclo ──────────────────────────────────────────────────────
  const cycleRequests = useMemo(() => {
    if (!snapshot) return [];
    if (!effectiveLens.cycleId) return snapshot.requests;
    return snapshot.requests.filter(
      (r) => (r.enrollmentCycleId ?? null) === effectiveLens.cycleId,
    );
  }, [snapshot, effectiveLens.cycleId]);

  // ── Assentos ──────────────────────────────────────────────────────────────
  const seats = useMemo(() => {
    if (!snapshot) return [];
    return buildSeats({
      requests: cycleRequests,
      students: snapshot.students,
      buses: snapshot.buses,
    });
  }, [snapshot, cycleRequests]);

  const lensedSeats = useMemo(
    () => applyLens(seats, effectiveLens),
    [seats, effectiveLens],
  );

  // ── Painéis ───────────────────────────────────────────────────────────────
  const grid = useMemo(() => gridByDayPeriod(lensedSeats), [lensedSeats]);

  const totals = useMemo(
    () => gridTotals(lensedSeats, grid),
    [lensedSeats, grid],
  );

  const frequency = useMemo(() => frequencyProfile(lensedSeats), [lensedSeats]);
  const overlap = useMemo(() => dayOverlap(lensedSeats), [lensedSeats]);

  const fleet = useMemo(
    () => byBus(lensedSeats, snapshot?.buses ?? [], isActiveCycle),
    [lensedSeats, snapshot?.buses, isActiveCycle],
  );

  const institutions = useMemo(
    () =>
      byUniversity(
        lensedSeats,
        snapshot?.students ?? [],
        snapshot?.universities ?? [],
        snapshot?.courses ?? [],
      ),
    [lensedSeats, snapshot?.students, snapshot?.universities, snapshot?.courses],
  );

  const funnel = useMemo(() => cycleFunnel(cycleRequests), [cycleRequests]);

  const capacityByBusDay = useMemo(() => {
    const map = new Map<string, { filled: number; capacity: number | null }>();
    if (!snapshot || !isActiveCycle) return map;
    for (const bus of snapshot.buses) {
      for (const day of DAYS) {
        // `capacity` é o teto do ônibus no dia; o preenchido do dia soma as
        // faculdades vinculadas e nunca passa da capacidade.
        const filled = (bus.universitySlots ?? []).reduce((sum, slot) => {
          const match = slot.daySlots?.find((d) => d.day === day);
          return sum + (match?.filledSlots ?? 0);
        }, 0);
        map.set(`${bus._id}|${day}`, {
          filled,
          capacity: bus.capacity ?? null,
        });
      }
    }
    return map;
  }, [snapshot, isActiveCycle]);

  // ── Opções dos filtros ────────────────────────────────────────────────────
  const universityOptions = useMemo<FilterOption[]>(() => {
    if (!snapshot) return [];
    const counts = new Map<string, number>();
    for (const row of institutions.rows) counts.set(row.universityId, row.students);
    return snapshot.universities
      .map((u) => ({
        value: u._id,
        label: u.acronym ? `${u.acronym} · ${u.name}` : u.name,
        hint: counts.has(u._id) ? String(counts.get(u._id)) : undefined,
        // Faculdade temporária aparece, mas marcada: misturar sem marcar polui
        // a leitura de instituições.
        badge: u.temporary ? "temp" : undefined,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [snapshot, institutions.rows]);

  const courseOptions = useMemo<FilterOption[]>(() => {
    if (!effectiveLens.universityId) return [];
    const row = institutions.rows.find(
      (r) => r.universityId === effectiveLens.universityId,
    );
    return (row?.courses ?? []).map((course) => ({
      value: course.courseKey,
      label: course.label,
      hint: String(course.students),
    }));
  }, [institutions.rows, effectiveLens.universityId]);

  const busOptions = useMemo<FilterOption[]>(() => {
    if (!snapshot) return [];
    const counts = new Map(fleet.map((load) => [load.busId, load.students]));
    return snapshot.buses
      .map((bus) => ({
        value: bus._id,
        label: busLabel(bus.identifier),
        hint: counts.has(bus._id) ? String(counts.get(bus._id)) : undefined,
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, "pt-BR", { numeric: true }),
      );
  }, [snapshot, fleet]);

  const shiftOptions = useMemo<FilterOption[]>(
    () => PERIODS.map((period) => ({ value: period, label: period })),
    [],
  );

  // ── Frase de leitura ──────────────────────────────────────────────────────
  const readout = useMemo(() => {
    const university = snapshot?.universities.find(
      (u) => u._id === effectiveLens.universityId,
    );
    const bus = snapshot?.buses.find((b) => b._id === effectiveLens.busId);
    const course = courseOptions.find(
      (c) => c.value === effectiveLens.courseKey,
    );

    const contextLabels = contextLabelsFromLens(effectiveLens, {
      university: university?.acronym ?? university?.name ?? null,
      course: course?.label ?? null,
      bus: bus ? busLabel(bus.identifier) : null,
    });

    const busesInLens = new Set(
      lensedSeats.map((s) => s.busId).filter((id): id is string => Boolean(id)),
    ).size;

    return buildReadout({
      lens: effectiveLens,
      grid,
      funnel,
      studentsActive: snapshot?.census.studentsActive ?? 0,
      peopleInLens: new Set(lensedSeats.map((s) => s.studentId)).size,
      busesInLens,
      contextLabels,
    });
  }, [snapshot, effectiveLens, courseOptions, grid, funnel, lensedSeats]);

  return {
    effectiveLens,
    cycles,
    selectedCycle,
    seats,
    lensedSeats,
    grid,
    totals,
    frequency,
    overlap,
    fleet,
    institutions,
    funnel,
    census: snapshot?.census ?? EMPTY_VIEW_CENSUS,
    readout,
    universityOptions,
    courseOptions,
    busOptions,
    shiftOptions,
    failures: snapshot?.failures ?? [],
    cycleIsEmpty: cycleRequests.length === 0,
    lensIsEmpty: lensedSeats.length === 0,
    capacityByBusDay,
    isActiveCycle,
  };
}
