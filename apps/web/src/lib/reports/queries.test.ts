import type { LLMProvider } from "@research/llm";
import type { ScrapeGraphClient, SearchResult } from "@research/scrapegraph";
import { describe, expect, it, vi } from "vitest";

import { interleaveResults, planQueries, searchQueries, searchResultCount } from "@/lib/reports/queries";

const r = (url: string): SearchResult => ({ url, title: "", content: "" });

function providerWith(expand: LLMProvider["expandQueries"]): LLMProvider {
  return { analyze: vi.fn(), expandQueries: expand };
}

describe("planQueries", () => {
  it("uses the LLM queries when valid", async () => {
    const queries = ["a 2026", "b 2026", "c 2026", "d 2026"];
    const provider = providerWith(vi.fn(async () => ({ queries, model: "m", usage: null })));
    expect(await planQueries("x", null, provider)).toEqual({ queries, source: "llm" });
  });

  it("falls back to templates on error, too few queries, or no provider", async () => {
    const failing = providerWith(vi.fn(async () => Promise.reject(new Error("HTTP 401"))));
    const short = providerWith(vi.fn(async () => ({ queries: ["a"], model: "m", usage: null })));
    const a = await planQueries("宠物用品", null, failing, 2026);
    expect(a).toMatchObject({ source: "fallback", error: "HTTP 401" });
    expect(a.queries[0]).toBe("宠物用品 新产品 发布 2026");
    expect((await planQueries("宠物用品", null, short, 2026)).source).toBe("fallback");
    expect((await planQueries("宠物用品", null, null, 2026)).queries).toHaveLength(5);
  });
});

describe("searchQueries", () => {
  it("splits the budget per query, interleaves and tolerates partial failures", async () => {
    const search = vi
      .fn<ScrapeGraphClient["search"]>()
      .mockResolvedValueOnce({ results: [r("https://a/1"), r("https://a/2")] })
      .mockRejectedValueOnce(new Error("HTTP 500"))
      .mockResolvedValueOnce({ results: [r("https://c/1")] });
    const result = await searchQueries({ search, extract: vi.fn() }, ["q1", "q2", "q3"], searchResultCount(5));
    expect(search).toHaveBeenCalledWith({ query: "q1", numResults: 3 });
    expect(result.failedQueries).toBe(1);
    expect(result.results.map((x) => x.url)).toEqual(["https://a/1", "https://c/1", "https://a/2"]);
  });

  it("throws when every query fails", async () => {
    const search = vi.fn<ScrapeGraphClient["search"]>().mockRejectedValue(new Error("HTTP 402"));
    await expect(searchQueries({ search, extract: vi.fn() }, ["q1"], 10)).rejects.toThrow("HTTP 402");
  });

  it("interleaves empty input", () => {
    expect(interleaveResults([])).toEqual([]);
  });
});
