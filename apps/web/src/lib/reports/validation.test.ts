import { describe, expect, it } from "vitest";

import { clampSourceLimit, createReportSchema } from "@/lib/reports/validation";

describe("createReportSchema", () => {
  it("trims the query and defaults sourceLimit to 5", () => {
    const result = createReportSchema.parse({ query: "  Notion 对比  " });
    expect(result).toEqual({ query: "Notion 对比", sourceLimit: 5, language: undefined });
  });

  it("accepts 5, 10 and 20 sources", () => {
    for (const sourceLimit of [5, 10, 20]) {
      expect(createReportSchema.safeParse({ query: "a", sourceLimit }).success).toBe(true);
    }
  });

  it.each([0, 6, 15, 25, "10", null])("rejects sourceLimit %s", (sourceLimit) => {
    expect(createReportSchema.safeParse({ query: "a", sourceLimit }).success).toBe(false);
  });

  it("rejects empty or whitespace-only queries", () => {
    expect(createReportSchema.safeParse({ query: "" }).success).toBe(false);
    expect(createReportSchema.safeParse({ query: "   " }).success).toBe(false);
    expect(createReportSchema.safeParse({}).success).toBe(false);
  });

  it("enforces the 200 character limit after trimming", () => {
    expect(createReportSchema.safeParse({ query: "a".repeat(200) }).success).toBe(true);
    expect(createReportSchema.safeParse({ query: `  ${"a".repeat(200)}  ` }).success).toBe(true);
    expect(createReportSchema.safeParse({ query: "a".repeat(201) }).success).toBe(false);
  });

  it("keeps an optional language and drops empty strings", () => {
    expect(createReportSchema.parse({ query: "a", language: "zh" }).language).toBe("zh");
    expect(createReportSchema.parse({ query: "a", language: " " }).language).toBeUndefined();
  });

  it("strips unknown keys such as user_id or isPaid", () => {
    const result = createReportSchema.parse({ query: "a", user_id: "x", isPaid: true });
    expect(result).not.toHaveProperty("user_id");
    expect(result).not.toHaveProperty("isPaid");
  });
});

describe("clampSourceLimit", () => {
  it("clamps free users to 5", () => {
    expect(clampSourceLimit(20, "free")).toBe(5);
    expect(clampSourceLimit(10, "free")).toBe(5);
    expect(clampSourceLimit(5, "free")).toBe(5);
  });

  it("lets pro users keep the requested limit", () => {
    expect(clampSourceLimit(20, "pro")).toBe(20);
    expect(clampSourceLimit(10, "pro")).toBe(10);
  });
});
