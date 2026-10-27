import { describe, expect, it } from "vitest";

import { exampleAnalysis, exampleItems } from "./__fixtures__/example-items";
import { filterUnknownItemIds, reportAnalysisSchema } from "./schema";

const chart = {
  type: "bar" as const,
  title: "时效性",
  description: "AI 分析",
  xKey: "name",
  yKeys: ["timeliness"],
  sourceItemIds: [exampleItems[0].itemId],
};

describe("reportAnalysisSchema", () => {
  it("accepts a valid analysis and defaults charts to []", () => {
    expect(reportAnalysisSchema.safeParse(exampleAnalysis).success).toBe(true);
    const { charts: _omit, ...withoutCharts } = exampleAnalysis;
    expect(reportAnalysisSchema.parse(withoutCharts).charts).toEqual([]);
  });

  it("enforces opportunity count, itemIds, scores and chart types", () => {
    const top = exampleAnalysis.topOpportunities[0];
    const parse = (patch: object) => reportAnalysisSchema.safeParse({ ...exampleAnalysis, ...patch }).success;
    expect(parse({ topOpportunities: [] })).toBe(false);
    expect(parse({ topOpportunities: Array(9).fill(top) })).toBe(false);
    expect(parse({ topOpportunities: [{ ...top, itemIds: [] }] })).toBe(false);
    expect(parse({ topOpportunities: [{ ...top, scores: { ...top.scores, evidence: 6 } }] })).toBe(false);
    expect(parse({ topOpportunities: [{ ...top, scores: { ...top.scores, feasibility: 2.5 } }] })).toBe(false);
    expect(parse({ charts: [{ ...chart, type: "radar" }] })).toBe(false);
  });
});

describe("filterUnknownItemIds", () => {
  const known = new Set(exampleItems.map((item) => item.itemId));

  it("keeps valid ids untouched", () => {
    const result = filterUnknownItemIds(exampleAnalysis, known);
    expect(result.dropped).toBe(0);
    expect(result.analysis).toEqual(exampleAnalysis);
  });

  it("drops hallucinated ids, unsupported opportunities, and adds a warning", () => {
    const [first, second] = exampleAnalysis.topOpportunities;
    const analysis = {
      ...exampleAnalysis,
      topOpportunities: [
        { ...first, itemIds: [...first.itemIds, "fake"] },
        { ...second, itemIds: ["fake-only"] },
      ],
      charts: [{ ...chart, sourceItemIds: ["fake-2", exampleItems[0].itemId] }],
    };
    const result = filterUnknownItemIds(analysis, known);
    expect(result.dropped).toBe(3);
    expect(result.analysis.topOpportunities).toHaveLength(1);
    expect(result.analysis.topOpportunities[0].itemIds).toEqual(first.itemIds);
    expect(result.analysis.charts[0].sourceItemIds).toEqual([exampleItems[0].itemId]);
    expect(result.analysis.warnings).toHaveLength(exampleAnalysis.warnings.length + 1);
  });
});
