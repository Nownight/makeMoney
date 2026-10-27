import { describe, expect, it } from "vitest";

import {
  cheapestPrice,
  normalizeBillingPeriod,
  normalizeCurrency,
  normalizeExtractedData,
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

  it("finds the cheapest known price", () => {
    const list = [price("$20/month"), price(null), price("$10/month")];
    expect(cheapestPrice(list)?.amount).toBe(10);
    expect(cheapestPrice([price(null)])).toBeNull();
    expect(cheapestPrice([price("$5"), price("免费")])?.amount).toBe(0);
  });
});

describe("normalizeExtractedData", () => {
  it("normalizes a full product without inventing data", () => {
    const result = normalizeExtractedData({
      name: "  Cursor ",
      company: " ",
      category: null,
      pricing: [
        { plan: "Hobby", price: "免费", currency: null, billingPeriod: null },
        { plan: " Pro ", price: "$20/month", currency: null, billingPeriod: null },
      ],
      freePlan: null,
      features: ["Tab", "tab", " Agent "],
      targetUsers: [],
      advantages: [],
      limitations: [""],
      sourceEvidence: [{ field: "pricing", text: " Pro  $20 " }, { field: "", text: "x" }],
    });

    expect(result).toEqual({
      name: "Cursor",
      company: null,
      category: null,
      pricing: [
        { plan: "Hobby", amount: 0, currency: null, period: null },
        { plan: "Pro", amount: 20, currency: "USD", period: "month" },
      ],
      freePlan: null,
      features: ["Tab", "Agent"],
      targetUsers: [],
      advantages: [],
      limitations: [],
      sourceEvidence: [{ field: "pricing", text: "Pro $20" }],
    });
  });
});
