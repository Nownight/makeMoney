import { describe, expect, it } from "vitest";

import { formatPrice, sourceStatusBadge, toProductRows } from "@/lib/reports/products";

describe("formatPrice", () => {
  it("formats normalized prices", () => {
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice({ plan: "a", amount: null, currency: null, period: null })).toBe("—");
    expect(formatPrice({ plan: "a", amount: 0, currency: null, period: null })).toBe("免费");
    expect(formatPrice({ plan: "a", amount: 20, currency: "USD", period: "month" })).toBe("USD 20/月");
    expect(formatPrice({ plan: "a", amount: 99, currency: null, period: null })).toBe("99");
  });
});

describe("sourceStatusBadge", () => {
  it("labels known statuses and tolerates unknown ones", () => {
    expect(sourceStatusBadge("extracted").label).toBe("已提取");
    expect(sourceStatusBadge("failed").variant).toBe("destructive");
    expect(sourceStatusBadge("toString").label).toBe("toString");
  });
});

describe("toProductRows", () => {
  it("joins sources and skips invalid rows", () => {
    const data = {
      name: "Cursor",
      company: "Anysphere",
      category: null,
      pricing: [
        { plan: "Pro", amount: 20, currency: "USD", period: "month" },
        { plan: "Hobby", amount: 0, currency: null, period: null },
      ],
      freePlan: true,
      features: ["a", "b"],
      targetUsers: [],
      advantages: [],
      limitations: [],
      sourceEvidence: [],
    };
    const rows = toProductRows(
      [
        { id: "i1", source_id: "s1", normalized_data: data },
        { id: "i2", source_id: "s1", normalized_data: { name: 1 } },
      ],
      [{ id: "s1", url: "https://cursor.com", domain: "cursor.com" }],
    );
    expect(rows).toEqual([
      {
        id: "i1",
        name: "Cursor",
        company: "Anysphere",
        cheapest: "免费",
        freePlan: true,
        featureCount: 2,
        sourceUrl: "https://cursor.com",
        sourceDomain: "cursor.com",
      },
    ]);
  });
});
