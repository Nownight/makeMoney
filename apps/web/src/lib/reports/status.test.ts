import { describe, expect, it } from "vitest";

import {
  REPORT_STATUS_LABELS,
  clampProgress,
  reportStatusLabel,
  reportStatusVariant,
} from "@/lib/reports/status";

describe("reportStatusLabel", () => {
  it("maps every status to a Chinese label", () => {
    expect(Object.keys(REPORT_STATUS_LABELS)).toHaveLength(8);
    expect(reportStatusLabel("queued")).toBe("排队中");
    expect(reportStatusLabel("completed")).toBe("已完成");
    expect(reportStatusLabel("failed")).toBe("失败");
  });

  it("falls back for unknown values", () => {
    expect(reportStatusLabel("bogus")).toBe("未知状态");
    expect(reportStatusLabel("toString")).toBe("未知状态");
  });
});

describe("reportStatusVariant", () => {
  it("highlights terminal states", () => {
    expect(reportStatusVariant("completed")).toBe("default");
    expect(reportStatusVariant("failed")).toBe("destructive");
    expect(reportStatusVariant("queued")).toBe("outline");
    expect(reportStatusVariant("analyzing")).toBe("secondary");
  });
});

describe("clampProgress", () => {
  it("keeps progress within 0..100", () => {
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(42.4)).toBe(42);
    expect(clampProgress(150)).toBe(100);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});
