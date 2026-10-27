import { describe, expect, it } from "vitest";

import {
  normalizeBillingPeriod,
  normalizeCurrency,
  normalizeDate,
  normalizeOpportunity,
  normalizePrice,
  normalizeStringList,
} from "./normalize";

const price = (p: number | string | null, currency: string | null = null, billingPeriod: string | null = null) =>
  normalizePrice({ plan: "Pro", price: p, currency, billingPeriod });

describe("normalizePrice", () => {
  it.each([
    ["$20/month", 20, "USD", "month"],
    ["20 USD monthly", 20, "USD", "month"],
    ["USD 20 / mo", 20, "USD", "month"],
    ["¥99/年", 99, "CNY", "year"],
    ["€8.50 per month, billed annually", 8.5, "EUR", "year"],
    ["$1,299 one-time", 1299, "USD", "once"],
    ["99元/月", 99, "CNY", "month"],
    ["£10/yr", 10, "GBP", "year"],
  ])("parses %s", (text, amount, currency, period) => {
    expect(price(text)).toEqual({ plan: "Pro", amount, currency, period });
  });

  it("maps free text to 0 without currency/period", () => {
    expect(price("免费")).toEqual({ plan: "Pro", amount: 0, currency: null, period: null });
    expect(price("Free")).toMatchObject({ amount: 0 });
  });

  it("never invents values", () => {
    expect(price("Contact sales")).toEqual({ plan: "Pro", amount: null, currency: null, period: null });
    expect(price(null)).toMatchObject({ amount: null, currency: null, period: null });
    expect(price("20")).toEqual({ plan: "Pro", amount: 20, currency: null, period: null });
  });

  it("prefers explicit fields and accepts numbers", () => {
    expect(price(15, "usd", "Annually")).toEqual({ plan: "Pro", amount: 15, currency: "USD", period: "year" });
    expect(price(-1)).toMatchObject({ amount: null });
  });
});

describe("helpers", () => {
  it("normalizes currencies", () => {
    expect(normalizeCurrency("RMB")).toBe("CNY");
    expect(normalizeCurrency("人民币")).toBe("CNY");
    expect(normalizeCurrency("美元")).toBe("USD");
    expect(normalizeCurrency("ABC")).toBeNull();
    expect(normalizeCurrency(null)).toBeNull();
  });

  it("normalizes billing periods", () => {
    expect(normalizeBillingPeriod("per month")).toBe("month");
    expect(normalizeBillingPeriod("每月")).toBe("month");
    expect(normalizeBillingPeriod("yearly")).toBe("year");
    expect(normalizeBillingPeriod("lifetime")).toBe("once");
    expect(normalizeBillingPeriod("weekly")).toBeNull();
    expect(normalizeBillingPeriod("")).toBeNull();
  });

  it("dedupes and trims string lists", () => {
    expect(normalizeStringList(["  A  b ", "a b", "", "  ", "C"])).toEqual(["A b", "C"]);
  });
});

describe("normalizeDate", () => {
  it("normalizes common formats to YYYY-MM-DD", () => {
    expect(normalizeDate("2026-03-05")).toBe("2026-03-05");
    expect(normalizeDate("2026-03-05T10:00:00Z")).toBe("2026-03-05");
    expect(normalizeDate("2026/3/5")).toBe("2026-03-05");
    expect(normalizeDate("2026年3月5日")).toBe("2026-03-05");
  });

  it("returns null for unknown, partial or invalid dates", () => {
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate("")).toBeNull();
    expect(normalizeDate("2026年3月")).toBeNull();
    expect(normalizeDate("2026-02-30")).toBeNull();
    expect(normalizeDate("上周")).toBeNull();
  });

  it("keeps the date part of datetimes", () => {
    expect(normalizeDate("2026-07-15 12:07")).toBe("2026-07-15");
    expect(normalizeDate("2026/07/15 12:07:30")).toBe("2026-07-15");
  });

  it("fills the year of month-day dates from the reference time", () => {
    const reference = new Date("2026-10-27T12:00:00Z");
    expect(normalizeDate("9月8日", reference)).toBe("2026-09-08");
    expect(normalizeDate("9月8号 10:30", reference)).toBe("2026-09-08");
    expect(normalizeDate("09-08", reference)).toBe("2026-09-08");
    expect(normalizeDate("10月28日", reference)).toBe("2026-10-28");
  });

  it("uses the previous year when a month-day date would be in the future", () => {
    const reference = new Date("2026-03-01T00:00:00Z");
    expect(normalizeDate("12月20日", reference)).toBe("2025-12-20");
    expect(normalizeDate("2月29日", reference)).toBeNull();
  });

  it("ignores month-day dates without a reference or when invalid", () => {
    expect(normalizeDate("9月8日")).toBeNull();
    expect(normalizeDate("13月8日", new Date("2026-10-27T00:00:00Z"))).toBeNull();
    expect(normalizeDate("9月", new Date("2026-10-27T00:00:00Z"))).toBeNull();
  });
});

describe("normalizeOpportunity", () => {
  it("trims, dedupes lists and normalizes the date without inventing data", () => {
    const result = normalizeOpportunity({
      title: "  AI 漫画  工具 ",
      type: "new_tool",
      summary: " 摘要 ",
      signals: ["A", "a", " "],
      evidence: [{ field: "eventDate", text: " 2026年3月5日  发布 " }, { field: "", text: "x" }],
      eventDate: "2026年3月5日",
      monetization: [],
      entryBarrier: null,
      competition: "high",
      targetAudience: [" 作者 ", "作者"],
    });
    expect(result).toEqual({
      title: "AI 漫画 工具",
      type: "new_tool",
      summary: "摘要",
      signals: ["A"],
      evidence: [{ field: "eventDate", text: "2026年3月5日 发布" }],
      eventDate: "2026-03-05",
      monetization: [],
      entryBarrier: null,
      competition: "high",
      targetAudience: ["作者"],
    });
  });
});
