import { beforeEach, describe, expect, it, vi } from "vitest";

import { http } from "./http";
import { licenseRequestService } from "./licenseRequestService";

vi.mock("./http", () => ({
  http: {
    get: vi.fn(),
    patch: vi.fn(),
    postForm: vi.fn(),
  },
}));

const getMock = vi.mocked(http.get);
const postFormMock = vi.mocked(http.postForm);

describe("licenseRequestService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getReviewCounts calls the review-counts endpoint without period", async () => {
    getMock.mockResolvedValueOnce({
      enrollmentPeriodId: "period-1",
      reissueCount: 2,
      documentResendCount: 3,
    });

    await licenseRequestService.getReviewCounts();

    expect(getMock).toHaveBeenCalledWith("/license-request/review-counts");
  });

  it("getReviewCounts includes enrollmentPeriodId when provided", async () => {
    getMock.mockResolvedValueOnce({
      enrollmentPeriodId: "period 1",
      reissueCount: 0,
      documentResendCount: 0,
    });

    await licenseRequestService.getReviewCounts("period 1");

    expect(getMock).toHaveBeenCalledWith(
      "/license-request/review-counts?enrollmentPeriodId=period%201",
    );
  });

  it("adminCreate posts multipart form with fields, schedule JSON and files", async () => {
    postFormMock.mockResolvedValueOnce({ message: "ok", requestId: "req-1" });
    const file = new File(["x"], "photo.png", { type: "image/png" });

    await licenseRequestService.adminCreate({
      studentId: "student-1",
      universityId: "uni-1",
      busId: "bus-1",
      degree: "Engenharia",
      shift: "Manhã",
      schedule: [{ day: "SEG", period: "Manhã" }],
      transportMode: "regular",
      documents: { ProfilePhoto: file, EnrollmentProof: null },
    });

    expect(postFormMock).toHaveBeenCalledTimes(1);
    const [path, form] = postFormMock.mock.calls[0];
    expect(path).toBe("/license-request/admin-create");
    const fd = form as FormData;
    expect(fd.get("studentId")).toBe("student-1");
    expect(fd.get("universityId")).toBe("uni-1");
    expect(fd.get("busId")).toBe("bus-1");
    expect(fd.get("schedule")).toBe(JSON.stringify([{ day: "SEG", period: "Manhã" }]));
    expect(fd.get("ProfilePhoto")).toBeInstanceOf(File);
    // null document não é anexado
    expect(fd.get("EnrollmentProof")).toBeNull();
  });

  it("adminCreate omits empty optional fields", async () => {
    postFormMock.mockResolvedValueOnce({ message: "ok", requestId: "req-2" });

    await licenseRequestService.adminCreate({ studentId: "student-2" });

    const [, form] = postFormMock.mock.calls[0];
    const fd = form as FormData;
    expect(fd.get("studentId")).toBe("student-2");
    expect(fd.get("universityId")).toBeNull();
    expect(fd.get("busId")).toBeNull();
  });
});
