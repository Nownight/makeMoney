import { describe, expect, it } from "vitest";

import { MIN_USABLE_SOURCES, searchResultCount } from "@/lib/reports/search-pipeline";

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
