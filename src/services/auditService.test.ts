import { beforeEach, describe, expect, it, vi } from "vitest";

import { http } from "./http";
import { auditService } from "./auditService";

vi.mock("./http", () => ({
  http: {
    get: vi.fn(),
  },
}));

const getMock = vi.mocked(http.get);

describe("auditService.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
  });

  it("calls /audit with no query string when no filters", async () => {
    await auditService.list();
    expect(getMock).toHaveBeenCalledWith("/audit");
  });

  it("serializes pagination and filters into the query string", async () => {
    await auditService.list({
      page: 2,
      limit: 30,
      actionPrefix: "student.",
      actorId: "admin-1",
      targetId: "stu-1",
      outcome: "failure",
    });
    const url = getMock.mock.calls[0][0];
    expect(url.startsWith("/audit?")).toBe(true);
    expect(url).toContain("page=2");
    expect(url).toContain("limit=30");
    expect(url).toContain("actionPrefix=student.");
    expect(url).toContain("actorId=admin-1");
    expect(url).toContain("targetId=stu-1");
    expect(url).toContain("outcome=failure");
  });

  it("omits empty/undefined filter values", async () => {
    await auditService.list({ page: 1, action: "", actorId: undefined });
    const url = getMock.mock.calls[0][0];
    expect(url).toContain("page=1");
    expect(url).not.toContain("action=");
    expect(url).not.toContain("actorId=");
  });

  it("serializes actorRoles (apenas funcionários)", async () => {
    await auditService.list({ page: 1, actorRoles: "admin,employee" });
    const url = getMock.mock.calls[0][0];
    expect(url).toContain("actorRoles=admin%2Cemployee");
  });
});

describe("auditService.participants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue([]);
  });

  it("calls /audit/participants without query by default", async () => {
    await auditService.participants();
    expect(getMock).toHaveBeenCalledWith("/audit/participants");
  });

  it("adds onlyStudents=true when requested", async () => {
    await auditService.participants(true);
    expect(getMock).toHaveBeenCalledWith(
      "/audit/participants?onlyStudents=true",
    );
  });
});
