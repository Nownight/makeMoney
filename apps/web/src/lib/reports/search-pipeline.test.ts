import { describe, expect, it } from "vitest";

import { MIN_USABLE_SOURCES, searchResultCount, splitCandidates } from "@/lib/reports/search-pipeline";

describe("searchResultCount", () => {
  it("requests twice the source limit, capped at 20", () => {
    expect(searchResultCount(5)).toBe(10);
    expect(searchResultCount(10)).toBe(20);
    expect(searchResultCount(20)).toBe(20);
  });

  it("requires at least 2 usable sources", () => {
    expect(MIN_USABLE_SOURCES).toBe(2);
  });
});

describe("splitCandidates", () => {
  it("keeps the top sourceLimit and up to sourceLimit backups", () => {
    const ranked = Array.from({ length: 12 }, (_, i) => i);
    expect(splitCandidates(ranked, 5)).toEqual({ primary: [0, 1, 2, 3, 4], backups: [5, 6, 7, 8, 9] });
    expect(splitCandidates([0, 1], 5)).toEqual({ primary: [0, 1], backups: [] });
  });
});
