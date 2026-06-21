import { describe, expect, it, vi } from "vitest";

import { http } from "./http";
import { licenseRequestService } from "./licenseRequestService";

vi.mock("./http", () => ({
  http: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const getMock = vi.mocked(http.get);

describe("licenseRequestService", () => {
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
});
