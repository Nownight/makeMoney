import { describe, expect, it } from "vitest";

import {
  extractionProgress,
  mapWithConcurrency,
  toItems,
} from "@/lib/reports/extract-pipeline";

describe("mapWithConcurrency", () => {
  it("keeps order and never exceeds the limit", async () => {
    let active = 0;
    let peak = 0;
    const result = await mapWithConcurrency([30, 10, 20, 5, 15], 3, async (ms, i) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, ms));
      active -= 1;
      return i * 2;
    });
    expect(result).toEqual([0, 2, 4, 6, 8]);
    expect(peak).toBe(3);
  });

  it("handles empty input", async () => {
    expect(await mapWithConcurrency([], 3, async () => 1)).toEqual([]);
  });
});

describe("extractionProgress", () => {
  it("maps 0..total to 20..65", () => {
    expect(extractionProgress(0, 5)).toBe(20);
    expect(extractionProgress(5, 5)).toBe(65);
    expect(extractionProgress(2, 5)).toBe(38);
    expect(extractionProgress(9, 5)).toBe(65);
    expect(extractionProgress(0, 0)).toBe(65);
  });
});

describe("toItems", () => {
  it("maps products to rows and passes through failures", () => {
    const product = {
      name: "Cursor",
      company: null,
      category: null,
      pricing: [],
      freePlan: null,
      features: [],
      targetUsers: [],
      advantages: [],
      limitations: [],
      sourceEvidence: [],
    };
    expect(toItems({ status: "extracted", attempts: 1, products: [product] })).toEqual({
      status: "extracted",
      cached: false,
      items: [{ entity_name: "Cursor", entity_type: "product", normalized_data: product, confidence: null }],
    });
    expect(toItems({ status: "partial", attempts: 3, reason: "x" })).toEqual({ status: "partial", reason: "x" });
  });
});
