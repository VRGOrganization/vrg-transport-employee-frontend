import { describe, expect, it } from "vitest";
import { buildSeats } from "../buildSeats";
import { UNKNOWN_BUS_KEY, UNKNOWN_COURSE_KEY } from "@/types/info.types";
import { alloc, bus, request, student } from "./factories";

const BUSES = [bus(), bus({ _id: "bus-2", identifier: "Ônibus 02" })];

describe("buildSeats", () => {
  it("ignora pedidos rejeitados e cancelados", () => {
    const seats = buildSeats({
      requests: [
        request({ _id: "r1", status: "rejected" }),
        request({ _id: "r2", status: "cancelled" }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats).toEqual([]);
  });

  it("conta pedidos pendentes e em lista de espera", () => {
    const seats = buildSeats({
      requests: [
        request({ _id: "r1", studentId: "s1", status: "pending" }),
        request({ _id: "r2", studentId: "s2", status: "waitlisted" }),
        request({ _id: "r3", studentId: "s3", status: "partially_waitlisted" }),
      ],
      students: [student({ _id: "s1" }), student({ _id: "s2" }), student({ _id: "s3" })],
      buses: BUSES,
    });

    expect(seats).toHaveLength(3);
  });

  it("ignora alocação cancelada dentro de um pedido válido", () => {
    const seats = buildSeats({
      requests: [
        request({
          allocationSummary: [
            alloc({ day: "SEG" }),
            alloc({ day: "TER", status: "cancelled" }),
          ],
        }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats).toHaveLength(1);
    expect(seats[0].day).toBe("SEG");
  });

  it("calcula legs para ida-só, volta-só e ida+volta", () => {
    const seats = buildSeats({
      requests: [
        request({
          allocationSummary: [
            alloc({ day: "SEG", needsOutbound: true, needsReturn: false }),
            alloc({ day: "TER", needsOutbound: false, needsReturn: true }),
            alloc({ day: "QUA", needsOutbound: true, needsReturn: true }),
          ],
        }),
      ],
      students: [student()],
      buses: BUSES,
    });

    const legsByDay = Object.fromEntries(seats.map((s) => [s.day, s.legs]));
    expect(legsByDay).toEqual({ SEG: 1, TER: 1, QUA: 2 });
  });

  it("mantém legs mínimo 1 quando ida e volta vêm falsos", () => {
    const seats = buildSeats({
      requests: [
        request({
          allocationSummary: [alloc({ needsOutbound: false, needsReturn: false })],
        }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats[0].legs).toBe(1);
  });

  it("deduplica o mesmo assento preferindo o pedido aprovado", () => {
    const seats = buildSeats({
      requests: [
        request({ _id: "r-pendente", status: "pending", createdAt: "2026-05-01T00:00:00Z" }),
        request({ _id: "r-aprovado", status: "approved", createdAt: "2026-01-01T00:00:00Z" }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats).toHaveLength(1);
    expect(seats[0].requestId).toBe("r-aprovado");
  });

  it("no empate de status, mantém o pedido mais recente", () => {
    const seats = buildSeats({
      requests: [
        request({ _id: "r-antigo", status: "approved", createdAt: "2026-01-01T00:00:00Z" }),
        request({ _id: "r-novo", status: "approved", createdAt: "2026-05-01T00:00:00Z" }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats).toHaveLength(1);
    expect(seats[0].requestId).toBe("r-novo");
  });

  it("não deduplica assentos do mesmo aluno em ônibus diferentes", () => {
    const seats = buildSeats({
      requests: [
        request({
          allocationSummary: [
            alloc({ day: "SEG", period: "Manhã", busId: "bus-1", busIdentifier: "Ônibus 01" }),
            alloc({ day: "SEG", period: "Noite", busId: "bus-2", busIdentifier: "Ônibus 02" }),
          ],
        }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats).toHaveLength(2);
  });

  it("resolve studentId vindo como string ou como objeto populado", () => {
    const seats = buildSeats({
      requests: [
        request({ _id: "r1", studentId: "stu-1" }),
        request({
          _id: "r2",
          // O backend às vezes popula a referência.
          studentId: { _id: "stu-2" } as unknown as string,
          allocationSummary: [alloc({ day: "TER" })],
        }),
      ],
      students: [student({ _id: "stu-1" }), student({ _id: "stu-2" })],
      buses: BUSES,
    });

    expect(seats.map((s) => s.studentId).sort()).toEqual(["stu-1", "stu-2"]);
  });

  it("resolve o ônibus pelo identificador quando o busId não é conhecido", () => {
    const seats = buildSeats({
      requests: [
        request({
          allocationSummary: [alloc({ busId: null, busIdentifier: "Ônibus 02" })],
        }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats[0].busId).toBe("bus-2");
  });

  it("mantém o assento no balde de ônibus não identificado em vez de descartar", () => {
    const seats = buildSeats({
      requests: [
        request({
          allocationSummary: [alloc({ busId: null, busIdentifier: "" })],
        }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats).toHaveLength(1);
    expect(seats[0].busId).toBeNull();
    expect(seats[0].busIdentifier).toBe(UNKNOWN_BUS_KEY);
  });

  it("normaliza o curso e usa o balde de não identificado quando falta degree", () => {
    const seats = buildSeats({
      requests: [
        request({ _id: "r1", studentId: "s1" }),
        request({ _id: "r2", studentId: "s2", allocationSummary: [alloc({ day: "TER" })] }),
      ],
      students: [
        student({ _id: "s1", degree: "  ENGENHARIA de PRODUÇÃO " }),
        student({ _id: "s2", degree: undefined }),
      ],
      buses: BUSES,
    });

    const byStudent = Object.fromEntries(seats.map((s) => [s.studentId, s.courseKey]));
    expect(byStudent.s1).toBe("engenharia de producao");
    expect(byStudent.s2).toBe(UNKNOWN_COURSE_KEY);
  });

  it("ignora dias e períodos fora do domínio", () => {
    const seats = buildSeats({
      requests: [
        request({
          allocationSummary: [
            alloc({ day: "SAB" }),
            alloc({ day: "SEG", period: "Madrugada" }),
            alloc({ day: "QUI" }),
          ],
        }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats).toHaveLength(1);
    expect(seats[0].day).toBe("QUI");
  });

  it("propaga o ciclo do pedido para o assento", () => {
    const seats = buildSeats({
      requests: [request({ enrollmentCycleId: "cycle-9" })],
      students: [student()],
      buses: BUSES,
    });

    expect(seats[0].cycleId).toBe("cycle-9");
  });

  it("usa a faculdade do aluno quando o pedido não traz universityId", () => {
    const seats = buildSeats({
      requests: [request({ universityId: null })],
      students: [student({ universityId: "uni-7" })],
      buses: BUSES,
    });

    expect(seats[0].universityId).toBe("uni-7");
  });

  it("marca o assento em lista de espera", () => {
    const seats = buildSeats({
      requests: [
        request({
          status: "partially_waitlisted",
          allocationSummary: [alloc({ status: "waitlisted" })],
        }),
      ],
      students: [student()],
      buses: BUSES,
    });

    expect(seats[0].status).toBe("waitlisted");
  });
});
