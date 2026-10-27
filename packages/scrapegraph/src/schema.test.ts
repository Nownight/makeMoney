import { describe, expect, it } from "vitest";

import fixture from "./__fixtures__/search-response.json";
import { searchResponseSchema } from "./schema";

describe("searchResponseSchema", () => {
  it("parses the documented response shape", () => {
    const parsed = searchResponseSchema.parse(fixture);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0]).toMatchObject({
      url: "https://scrapegraphai.com/pricing",
      title: "Pricing - ScrapeGraphAI",
    });
    expect(parsed.metadata?.pages).toEqual({ requested: 3, scraped: 2 });
  });

  it("defaults missing title/content to empty strings", () => {
    const parsed = searchResponseSchema.parse({
      results: [{ url: "https://a.com", title: null }],
    });
    expect(parsed.results[0]).toMatchObject({ title: "", content: "" });
  });

  it("rejects responses without results", () => {
    expect(searchResponseSchema.safeParse({ error: "x" }).success).toBe(false);
    expect(searchResponseSchema.safeParse({ results: [{ title: "no url" }] }).success).toBe(false);
  });
});
