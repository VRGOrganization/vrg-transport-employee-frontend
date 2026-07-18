import { describe, expect, it, vi } from "vitest";

import { http } from "./http";
import { systemNoticeTemplateService } from "./systemNoticeTemplateService";

vi.mock("./http", async () => {
  const actual = await vi.importActual<typeof import("./http")>("./http");
  return {
    ...actual,
    http: {
      get: vi.fn(),
      patch: vi.fn(),
    },
  };
});

const getMock = vi.mocked(http.get);
const patchMock = vi.mocked(http.patch);

describe("systemNoticeTemplateService", () => {
  it("list gets /system-notice-templates", async () => {
    const templates = [{ key: "WINDOW_OPEN", title: "t", body: "b" }];
    getMock.mockResolvedValueOnce(templates);

    const result = await systemNoticeTemplateService.list();

    expect(getMock).toHaveBeenCalledWith("/system-notice-templates");
    expect(result).toBe(templates);
  });

  it("update patches /system-notice-templates/:key with the given body", async () => {
    const updated = { key: "WINDOW_OPEN", title: "novo", body: "b" };
    patchMock.mockResolvedValueOnce(updated);

    const result = await systemNoticeTemplateService.update("WINDOW_OPEN", { title: "novo" });

    expect(patchMock).toHaveBeenCalledWith("/system-notice-templates/WINDOW_OPEN", {
      title: "novo",
    });
    expect(result).toBe(updated);
  });
});
