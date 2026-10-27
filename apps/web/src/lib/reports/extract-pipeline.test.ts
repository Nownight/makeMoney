import type { ScrapeGraphClient } from "@research/scrapegraph";
import { describe, expect, it, vi } from "vitest";

import {
  extractionProgress,
  mapWithConcurrency,
  needsBackfill,
  runExtraction,
  toItems,
} from "@/lib/reports/extract-pipeline";

/** Minimal chainable Supabase stand-in: every query resolves to no data, no error. */
function fakeAdmin() {
  const chain: Record<string, unknown> = {};
  for (const method of ["from", "select", "insert", "update", "eq", "gte", "order", "limit", "single", "maybeSingle"]) {
    chain[method] = () => chain;
  }
  chain.then = (resolve: (value: unknown) => void) => resolve({ data: null, error: null });
  return chain as never;
}

const signal = {
  title: "AI 编程助手发布",
  type: "new_tool",
  summary: "编程",
  signals: [],
  evidence: [],
  eventDate: null,
  monetization: [],
  entryBarrier: null,
  competition: null,
  targetAudience: [],
};

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
  it("maps opportunities to rows and passes through failures", () => {
    const opportunity = {
      title: "AI 漫画工具上线",
      type: "new_tool" as const,
      summary: "",
      signals: [],
      evidence: [],
      eventDate: "2026-03-05",
      monetization: [],
      entryBarrier: null,
      competition: null,
      targetAudience: [],
    };
    expect(toItems({ status: "extracted", irrelevant: 0, attempts: 1, opportunities: [opportunity] })).toEqual({
      status: "extracted",
      cached: false,
      items: [
        { entity_name: "AI 漫画工具上线", entity_type: "opportunity", normalized_data: opportunity, confidence: null },
      ],
    });
    expect(toItems({ status: "partial", attempts: 3, reason: "x" })).toEqual({ status: "partial", reason: "x" });
  });
});

describe("needsBackfill", () => {
  it("backfills failed and empty sources only", () => {
    expect(needsBackfill({ status: "failed" })).toBe(true);
    expect(needsBackfill({ status: "extracted", items: [] })).toBe(true);
    expect(needsBackfill({ status: "extracted", items: [1] })).toBe(false);
  });
});

describe("runExtraction backfill", () => {
  it("tries the next candidate when a source fails, without searching", async () => {
    const extract = vi.fn<ScrapeGraphClient["extract"]>(async ({ url }) => {
      if (url.includes("ibm.com")) throw new Error("HTTP 500");
      return { json: { opportunities: [signal] } };
    });
    const search = vi.fn();
    const backups = [{ id: "s3", url: "https://c.com/p" }];
    const summary = await runExtraction(
      fakeAdmin(),
      { search, extract },
      { reportId: "r1", query: "AI编程工具", referenceDate: new Date("2026-10-27T00:00:00Z") },
      [
        { id: "s1", url: "https://ibm.com/x" },
        { id: "s2", url: "https://b.com/p" },
      ],
      async () => backups.shift() ?? null,
    );
    expect(summary).toEqual({ total: 3, extracted: 2, itemCount: 2 });
    expect(search).not.toHaveBeenCalled();
  });
});
