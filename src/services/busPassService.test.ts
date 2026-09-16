import { HttpResponse, http as mswHttp } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import { busPassService } from "@/services/busPassService";
import { resetHttpState } from "@/services/http";
import type { ApiError } from "@/types/api";

describe("busPassService", () => {
  beforeEach(() => {
    resetHttpState();
  });

  describe("list", () => {
    it("monta a query com status repetido e filtros de data", async () => {
      let seen = "";
      server.use(
        mswHttp.get("/api/v1/bus-pass", ({ request }) => {
          seen = new URL(request.url).search;
          return HttpResponse.json([]);
        }),
      );

      await busPassService.list({
        status: ["pending", "revision"],
        travelDateFrom: "2026-08-10",
        travelDateTo: "2026-08-24",
        limit: 100,
      });

      expect(seen).toContain("status=pending");
      expect(seen).toContain("status=revision");
      expect(seen).toContain("travelDateFrom=2026-08-10");
      expect(seen).toContain("travelDateTo=2026-08-24");
    });

    it("não envia filtros vazios", async () => {
      let seen = "";
      server.use(
        mswHttp.get("/api/v1/bus-pass", ({ request }) => {
          seen = new URL(request.url).search;
          return HttpResponse.json([]);
        }),
      );

      await busPassService.list({});

      expect(seen).toBe("");
    });

    it("normaliza resposta paginada", async () => {
      server.use(
        mswHttp.get("/api/v1/bus-pass", () =>
          HttpResponse.json({ data: [{ id: "p1" }], total: 1 }),
        ),
      );

      await expect(busPassService.list()).resolves.toEqual([{ id: "p1" }]);
    });
  });

  describe("approve", () => {
    it("preserva o `conflict` do 409 para a tela decidir", async () => {
      server.use(
        mswHttp.patch("/api/v1/bus-pass/p1/approve", () =>
          HttpResponse.json(
            {
              statusCode: 409,
              message: "O ônibus escolhido lotou antes da aprovação.",
              conflict: {
                leg: "outbound",
                busIdentifier: "BUS-A",
                universityId: "uni-a",
              },
            },
            { status: 409 },
          ),
        ),
      );

      // É este contrato que faz o diálogo "negar ou devolver" existir: sem o
      // `conflict` sobrevivendo até aqui, a tela só saberia que falhou.
      const error = (await busPassService
        .approve("p1")
        .catch((err: ApiError) => err)) as ApiError;

      expect(error.status).toBe(409);
      expect(error.message).toMatch(/lotou/);
      expect(
        (error.details as { conflict?: { busIdentifier?: string } })?.conflict,
      ).toMatchObject({ leg: "outbound", busIdentifier: "BUS-A" });
    });
  });

  describe("manifest", () => {
    it("passa data e ônibus na query", async () => {
      let seen = "";
      server.use(
        mswHttp.get("/api/v1/bus-pass/manifest", ({ request }) => {
          seen = new URL(request.url).search;
          return HttpResponse.json([]);
        }),
      );

      await busPassService.manifest("2026-08-12", "bus-a");

      expect(seen).toContain("date=2026-08-12");
      expect(seen).toContain("busId=bus-a");
    });

    it("omite o ônibus quando não informado", async () => {
      let seen = "";
      server.use(
        mswHttp.get("/api/v1/bus-pass/manifest", ({ request }) => {
          seen = new URL(request.url).search;
          return HttpResponse.json([]);
        }),
      );

      await busPassService.manifest("2026-08-12");

      expect(seen).not.toContain("busId");
    });
  });

  describe("settings", () => {
    it("lê as configurações", async () => {
      await expect(busPassService.getSettings()).resolves.toMatchObject({
        monthlyQuota: 4,
      });
    });

    it("envia só os campos alterados no PATCH", async () => {
      let body: unknown = null;
      server.use(
        mswHttp.patch("/api/v1/bus-pass/settings", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            monthlyQuota: 6,
            minAdvanceHourBR: 18,
            maxHorizonDays: 14,
            updatedByAdminId: "admin-1",
            updatedAt: new Date().toISOString(),
          });
        }),
      );

      await busPassService.updateSettings({ monthlyQuota: 6 });

      expect(body).toEqual({ monthlyQuota: 6 });
    });
  });
});
