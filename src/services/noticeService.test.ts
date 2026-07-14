import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_URL, http } from "./http";
import { noticeService } from "./noticeService";

vi.mock("./http", async () => {
  const actual = await vi.importActual<typeof import("./http")>("./http");
  return {
    ...actual,
    http: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const getMock = vi.mocked(http.get);
const postMock = vi.mocked(http.post);
const deleteMock = vi.mocked(http.delete);

describe("noticeService", () => {
  it("listNotices gets /employee/notices", async () => {
    const notices = [{ id: "notice-1", title: "Aviso" }];
    getMock.mockResolvedValueOnce(notices);

    const result = await noticeService.listNotices();

    expect(getMock).toHaveBeenCalledWith("/employee/notices");
    expect(result).toBe(notices);
  });

  it("createNotice posts to /employee/notices with the given body", async () => {
    const input = { type: "message" as const, title: "Aviso", expiresInDays: 7 };
    postMock.mockResolvedValueOnce({ id: "notice-1" });

    await noticeService.createNotice(input);

    expect(postMock).toHaveBeenCalledWith("/employee/notices", input);
  });

  it("cancelScheduledNotice posts to the cancel endpoint", async () => {
    postMock.mockResolvedValueOnce(undefined);

    await noticeService.cancelScheduledNotice("notice-1");

    expect(postMock).toHaveBeenCalledWith("/employee/notices/notice-1/cancel", {});
  });

  it("deleteNotice calls delete on the notice endpoint", async () => {
    deleteMock.mockResolvedValueOnce(undefined);

    await noticeService.deleteNotice("notice-1");

    expect(deleteMock).toHaveBeenCalledWith("/employee/notices/notice-1");
  });

  it("getPollResults fetches results for the notice", async () => {
    const results = { aggregate: [], nominal: null };
    getMock.mockResolvedValueOnce(results);

    const result = await noticeService.getPollResults("notice-1");

    expect(getMock).toHaveBeenCalledWith("/employee/notices/notice-1/results");
    expect(result).toBe(results);
  });

  describe("exportPollResults", () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockReset();
    });

    it("returns the raw CSV text without attempting JSON.parse", async () => {
      const csv = "option,votes\nSim,3\nNao,1";
      fetchMock.mockResolvedValueOnce(
        new Response(csv, { status: 200 }),
      );

      const result = await noticeService.exportPollResults("notice-1");

      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/employee/notices/notice-1/export`,
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
      expect(result).toBe(csv);
    });

    it("rejects the promise when the response is not ok", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response("Notice not found", { status: 404 }),
      );

      await expect(noticeService.exportPollResults("missing")).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
