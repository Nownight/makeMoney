import { describe, expect, it } from "vitest";

import { exampleAnalysis, exampleItems } from "./__fixtures__/example-items";
import { filterUnknownItemIds, reportAnalysisSchema } from "./schema";

describe("reportAnalysisSchema", () => {
  it("accepts a valid analysis", () => {
    expect(reportAnalysisSchema.safeParse(exampleAnalysis).success).toBe(true);
  });

  it("enforces key finding count and chart types", () => {
    expect(reportAnalysisSchema.safeParse({ ...exampleAnalysis, keyFindings: ["a"] }).success).toBe(false);
    expect(
      reportAnalysisSchema.safeParse({ ...exampleAnalysis, keyFindings: Array(9).fill("a") }).success,
    ).toBe(false);
    const badChart = { ...exampleAnalysis.charts[0], type: "radar" };
    expect(reportAnalysisSchema.safeParse({ ...exampleAnalysis, charts: [badChart] }).success).toBe(false);
  });
});

describe("filterUnknownItemIds", () => {
  const known = new Set(exampleItems.map((item) => item.itemId));

  it("keeps valid ids untouched", () => {
    const result = filterUnknownItemIds(exampleAnalysis, known);
    expect(result.dropped).toBe(0);
    expect(result.analysis).toEqual(exampleAnalysis);
  });

  it("drops hallucinated ids and adds a warning", () => {
    const analysis = {
      ...exampleAnalysis,
      rankings: [{ ...exampleAnalysis.rankings[0], items: [...exampleAnalysis.rankings[0].items, { itemId: "fake", value: 1 }] }],
      charts: [{ ...exampleAnalysis.charts[0], sourceItemIds: ["fake-2", exampleItems[0].itemId] }],
    };
    const result = filterUnknownItemIds(analysis, known);
    expect(result.dropped).toBe(2);
    expect(result.analysis.rankings[0].items).toHaveLength(2);
    expect(result.analysis.charts[0].sourceItemIds).toEqual([exampleItems[0].itemId]);
    expect(result.analysis.warnings).toHaveLength(1);
  });
});
