import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/auth/session", () => {
    return HttpResponse.json({ message: "Sessao nao encontrada." }, { status: 401 });
  }),
  // Universities list for previews/tests
  http.get("/api/v1/university", () => {
    const now = new Date().toISOString();
    const data = [
      { _id: "u1", name: "Universidade Alpha", acronym: "UA", address: "Rua A, 123", active: true, createdAt: now, updatedAt: now },
      { _id: "u2", name: "Universidade Beta", acronym: "UB", address: "Rua B, 456", active: true, createdAt: now, updatedAt: now },
      { _id: "u3", name: "Universidade Gama", acronym: "UG", address: "Rua C, 789", active: true, createdAt: now, updatedAt: now },
    ];
    return HttpResponse.json(data);
  }),
  // Bus list with queue counts for previews
  http.get("/api/v1/bus/with-queue-counts", () => {
    const now = new Date().toISOString();
    const data = [
      {
        _id: "b1",
        identifier: "Onibus 1",
        shift: "Manhã",
        active: true,
        universitySlots: [
          { universityId: { _id: "u1", acronym: "UA", name: "Universidade Alpha" }, priorityOrder: 1, filledSlots: 10, pendingCount: 2, waitlistedCount: 4 },
          { universityId: { _id: "u2", acronym: "UB", name: "Universidade Beta" }, priorityOrder: 2, filledSlots: 5, pendingCount: 1, waitlistedCount: 3 },
        ],
        waitlistedCount: 7,
        pendingCount: 3,
        filledSlotsTotal: 15,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: "b2",
        identifier: "Onibus 2",
        shift: "Tarde",
        active: true,
        universitySlots: [
          { universityId: { _id: "u3", acronym: "UG", name: "Universidade Gama" }, priorityOrder: 1, filledSlots: 8, pendingCount: 0, waitlistedCount: 2 },
        ],
        waitlistedCount: 2,
        pendingCount: 0,
        filledSlotsTotal: 8,
        createdAt: now,
        updatedAt: now,
      },
    ];
    return HttpResponse.json(data);
  }),
];
