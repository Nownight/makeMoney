import { describe, expect, it } from "vitest";

import { cleanQueries, fallbackQueries, perQueryResults, queryExpansionSchema } from "./queries";

describe("fallbackQueries", () => {
  it("is deterministic and covers every angle with the year", () => {
    const queries = fallbackQueries("  AI   漫画 ", 2026);
    expect(queries).toEqual(fallbackQueries("AI 漫画", 2026));
    expect(queries).toHaveLength(5);
    expect(queries.every((q) => q.startsWith("AI 漫画 ") && q.endsWith(" 2026"))).toBe(true);
    for (const angle of ["发布", "融资", "痛点", "变现", "政策"]) {
      expect(queries.some((q) => q.includes(angle))).toBe(true);
    }
    expect(queryExpansionSchema.safeParse({ queries }).success).toBe(true);
  });
});

describe("query helpers", () => {
  it("validates 4-6 queries", () => {
    expect(queryExpansionSchema.safeParse({ queries: ["a", "b", "c"] }).success).toBe(false);
    expect(queryExpansionSchema.safeParse({ queries: Array(7).fill("a") }).success).toBe(false);
  });

  it("cleans and dedupes queries", () => {
    expect(cleanQueries([" a  b ", "A B", "", "c"])).toEqual(["a b", "c"]);
  });

  it("splits the result budget across queries", () => {
    expect(perQueryResults(10, 5)).toBe(2);
    expect(perQueryResults(20, 6)).toBe(3);
    expect(perQueryResults(2, 5)).toBe(1);
    expect(perQueryResults(10, 0)).toBe(0);
  });
});
