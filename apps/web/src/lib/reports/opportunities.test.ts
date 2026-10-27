import { describe, expect, it } from "vitest";

import {
  levelLabel,
  parseSearchQueries,
  sourceStatusBadge,
  supportingSources,
  toOpportunityRows,
} from "@/lib/reports/opportunities";

describe("sourceStatusBadge", () => {
  it("labels known statuses and tolerates unknown ones", () => {
    expect(sourceStatusBadge("extracted").label).toBe("已提取");
    expect(sourceStatusBadge("failed").variant).toBe("destructive");
    expect(sourceStatusBadge("toString").label).toBe("toString");
  });
});

describe("levelLabel", () => {
  it("maps levels to Chinese", () => {
    expect(levelLabel("low")).toBe("低");
    expect(levelLabel("high")).toBe("高");
    expect(levelLabel(null)).toBe("未知");
  });
});

const data = {
  title: "AI 漫画工具上线",
  type: "new_tool",
  summary: "",
  signals: [],
  evidence: [],
  eventDate: "2026-03-05",
  monetization: [],
  entryBarrier: "low",
  competition: null,
  targetAudience: [],
};

describe("toOpportunityRows", () => {
  it("joins sources, maps labels and skips invalid rows", () => {
    const rows = toOpportunityRows(
      [
        { id: "i1", source_id: "s1", normalized_data: data },
        { id: "i2", source_id: "s1", normalized_data: { name: "old product row" } },
      ],
      [{ id: "s1", url: "https://a.com/news/1", domain: "a.com" }],
    );
    expect(rows).toEqual([
      {
        id: "i1",
        title: "AI 漫画工具上线",
        type: "new_tool",
        typeLabel: "新工具",
        summary: expect.any(String),
        eventDate: "2026-03-05",
        barrier: "低",
        competition: "未知",
        sourceUrl: "https://a.com/news/1",
        sourceDomain: "a.com",
      },
    ]);
  });
});

describe("report helpers", () => {
  it("parses stored search queries defensively", () => {
    expect(parseSearchQueries(["a", 1, "b"])).toEqual(["a", "b"]);
    expect(parseSearchQueries(null)).toEqual([]);
    expect(parseSearchQueries({ a: 1 })).toEqual([]);
  });

  it("lists unique supporting sources for item ids", () => {
    const rows = toOpportunityRows(
      [
        { id: "i1", source_id: "s1", normalized_data: data },
        { id: "i2", source_id: "s1", normalized_data: data },
      ],
      [{ id: "s1", url: "https://a.com/x", domain: "a.com" }],
    );
    expect(supportingSources(["i1", "i2", "missing"], rows)).toEqual([{ url: "https://a.com/x", domain: "a.com" }]);
  });
});
