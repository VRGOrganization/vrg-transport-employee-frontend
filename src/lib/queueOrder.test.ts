import { describe, expect, it } from "vitest";

import {
  buildQueueRequestByStudent,
  compareQueueRequests,
  compareWaitlistRequests,
  sortStudentsByQueue,
  type QueueRequest,
} from "./queueOrder";

const req = (over: Partial<QueueRequest> & { studentId: string }): QueueRequest =>
  ({
    status: "pending",
    createdAt: "2026-01-01T00:00:00Z",
    ...over,
  }) as QueueRequest;

describe("compareQueueRequests", () => {
  it("ordena por FIFO (createdAt asc) quando a prioridade empata", () => {
    const a = req({ studentId: "A", createdAt: "2026-01-01T10:00:00Z" });
    const b = req({ studentId: "B", createdAt: "2026-01-01T10:05:00Z" });

    expect([b, a].sort(compareQueueRequests).map((r) => r.studentId)).toEqual(["A", "B"]);
  });

  it("prioridade menor vem antes, mesmo sendo mais recente", () => {
    const antigo = req({ studentId: "A", createdAt: "2026-01-01T10:00:00Z", priorityLevel: 3 });
    const prioritario = req({
      studentId: "B",
      createdAt: "2026-01-01T10:05:00Z",
      priorityLevel: 1,
    });

    expect([antigo, prioritario].sort(compareQueueRequests).map((r) => r.studentId)).toEqual([
      "B",
      "A",
    ]);
  });

  it("trata prioridade ausente como o default 3 do backend", () => {
    const semNivel = req({ studentId: "A", createdAt: "2026-01-01T10:00:00Z" });
    const nivelTres = req({
      studentId: "B",
      createdAt: "2026-01-01T10:05:00Z",
      priorityLevel: 3,
    });

    expect([nivelTres, semNivel].sort(compareQueueRequests).map((r) => r.studentId)).toEqual([
      "A",
      "B",
    ]);
  });

  it("data inválida vai para o fim da fila, nunca para o topo", () => {
    const valido = req({ studentId: "A", createdAt: "2026-01-01T10:00:00Z" });
    const invalido = req({ studentId: "B", createdAt: "data-quebrada" });

    expect([invalido, valido].sort(compareQueueRequests).map((r) => r.studentId)).toEqual([
      "A",
      "B",
    ]);
  });
});

describe("compareWaitlistRequests", () => {
  it("respeita filaPosition antes do FIFO", () => {
    const a = req({ studentId: "A", createdAt: "2026-01-01T10:00:00Z", filaPosition: 2 });
    const b = req({ studentId: "B", createdAt: "2026-01-01T10:05:00Z", filaPosition: 1 });

    expect([a, b].sort(compareWaitlistRequests).map((r) => r.studentId)).toEqual(["B", "A"]);
  });

  it("cai no FIFO quando não há filaPosition", () => {
    const a = req({ studentId: "A", createdAt: "2026-01-01T10:00:00Z" });
    const b = req({ studentId: "B", createdAt: "2026-01-01T10:05:00Z" });

    expect([b, a].sort(compareWaitlistRequests).map((r) => r.studentId)).toEqual(["A", "B"]);
  });
});

describe("buildQueueRequestByStudent", () => {
  it("mantém o pedido enfileirado em vez de um rejeitado mais recente", () => {
    const pendente = req({
      studentId: "A",
      status: "pending",
      createdAt: "2026-01-01T10:00:00Z",
    });
    const rejeitado = req({
      studentId: "A",
      status: "rejected",
      createdAt: "2026-01-02T10:00:00Z",
    });

    const map = buildQueueRequestByStudent([rejeitado, pendente]);
    expect(map.get("A")?.status).toBe("pending");
  });

  it("entre dois pedidos do mesmo tipo, mantém o mais recente", () => {
    const antigo = req({ studentId: "A", status: "rejected", createdAt: "2026-01-01T10:00:00Z" });
    const novo = req({ studentId: "A", status: "rejected", createdAt: "2026-01-05T10:00:00Z" });

    const map = buildQueueRequestByStudent([antigo, novo]);
    expect(map.get("A")?.createdAt).toBe("2026-01-05T10:00:00Z");
  });
});

describe("sortStudentsByQueue", () => {
  const students = [
    { _id: "B", name: "Bruno" },
    { _id: "A", name: "Ana" },
  ];

  it("ordena alunos em FIFO independentemente da ordem vinda de GET /student", () => {
    const map = buildQueueRequestByStudent([
      req({ studentId: "B", createdAt: "2026-01-01T10:05:00Z" }),
      req({ studentId: "A", createdAt: "2026-01-01T10:00:00Z" }),
    ]);

    expect(sortStudentsByQueue(students, map).map((s) => s._id)).toEqual(["A", "B"]);
  });

  it("alunos sem pedido vão para o fim, em ordem alfabética", () => {
    const map = buildQueueRequestByStudent([
      req({ studentId: "B", createdAt: "2026-01-01T10:05:00Z" }),
    ]);
    const list = [
      { _id: "C", name: "Carlos" },
      { _id: "A", name: "Ana" },
      { _id: "B", name: "Bruno" },
    ];

    expect(sortStudentsByQueue(list, map).map((s) => s._id)).toEqual(["B", "A", "C"]);
  });

  it("não muta o array recebido", () => {
    const map = buildQueueRequestByStudent([
      req({ studentId: "A", createdAt: "2026-01-01T10:00:00Z" }),
    ]);
    const original = [...students];
    sortStudentsByQueue(students, map);

    expect(students).toEqual(original);
  });
});
