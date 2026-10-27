import { describe, expect, it } from "vitest";

import { filterSources, isJunkUrl, normalizeUrl, scoreSource, toSnippet } from "./filter";
import type { SearchResult } from "./schema";

const result = (url: string, title = "T", content = "body"): SearchResult => ({ url, title, content });

describe("normalizeUrl", () => {
  it("strips hash, trailing slash and utm_* params", () => {
    expect(normalizeUrl("https://Example.com/a/b/?utm_source=x&id=1#top")).toBe("https://example.com/a/b?id=1");
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com");
  });

  it("rejects non-http(s) and invalid URLs", () => {
    expect(normalizeUrl("ftp://example.com")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});

describe("isJunkUrl", () => {
  it.each([
    "https://www.google.com/search?q=x",
    "https://www.baidu.com/s?wd=x",
    "https://www.bing.com/search?q=x",
    "https://example.com/login",
    "https://example.com/users/sign-up",
    "https://example.com/logo.png",
  ])("flags %s", (url) => {
    expect(isJunkUrl(url)).toBe(true);
  });

  it.each([
    "https://cursor.com/pricing",
    "https://cloud.google.com/products/gemini",
    "https://example.com/blog/login-best-practices",
  ])("keeps %s", (url) => {
    expect(isJunkUrl(url)).toBe(false);
  });
});

describe("scoreSource", () => {
  it("prefers domains containing a query keyword", () => {
    expect(scoreSource("https://cursor.com", 3, "Cursor pricing")).toBeGreaterThan(
      scoreSource("https://randomblog.com", 3, "Cursor pricing"),
    );
  });

  it("penalizes social networks and stays within 0..100", () => {
    const social = scoreSource("https://twitter.com/a", 1, "x");
    expect(social).toBeLessThan(scoreSource("https://news.example.com/a", 1, "x"));
    expect(scoreSource("https://docs.cursor.org", 1, "cursor")).toBeLessThanOrEqual(100);
  });
});

describe("toSnippet", () => {
  it("removes markdown noise and truncates", () => {
    expect(toSnippet("## Title\n\n[link](https://x.com) **bold**")).toBe("Title link bold");
    expect(toSnippet("a".repeat(400))).toHaveLength(301);
  });
});

describe("filterSources", () => {
  it("dedupes normalized URLs and drops junk", () => {
    const sources = filterSources(
      [
        result("https://a.com/x"),
        result("https://a.com/x/#frag"),
        result("https://a.com/x?utm_medium=cpc"),
        result("https://www.google.com/search?q=a"),
        result("mailto:hi@a.com"),
        result("https://b.com/login"),
      ],
      "q",
      10,
    );
    expect(sources.map((s) => s.url)).toEqual(["https://a.com/x"]);
  });

  it("keeps at most 2 results per domain", () => {
    const sources = filterSources(
      [result("https://a.com/1"), result("https://www.a.com/2"), result("https://a.com/3"), result("https://b.com/1")],
      "q",
      10,
    );
    expect(sources.filter((s) => s.domain === "a.com")).toHaveLength(2);
    expect(sources).toHaveLength(3);
  });

  it("caps to the limit and ranks official-looking domains first", () => {
    const sources = filterSources(
      [result("https://blog1.com/a"), result("https://blog2.com/a"), result("https://cursor.com/features")],
      "Cursor features",
      2,
    );
    expect(sources).toHaveLength(2);
    expect(sources[0].domain).toBe("cursor.com");
    expect(sources[0].searchRank).toBe(3);
  });

  it("falls back to the domain when the title is empty", () => {
    expect(filterSources([result("https://a.com", "  ")], "q", 5)[0].title).toBe("a.com");
  });
});
