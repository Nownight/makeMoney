import { z } from "zod";

import type { Product } from "./product";

export const pricePeriodSchema = z.enum(["month", "year", "once"]).nullable();

export const normalizedPriceSchema = z.object({
  plan: z.string(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  period: pricePeriodSchema,
});

/** Shape stored in extracted_items.normalized_data. */
export const normalizedProductSchema = z.object({
  name: z.string(),
  company: z.string().nullable(),
  category: z.string().nullable(),
  pricing: z.array(normalizedPriceSchema),
  freePlan: z.boolean().nullable(),
  features: z.array(z.string()),
  targetUsers: z.array(z.string()),
  advantages: z.array(z.string()),
  limitations: z.array(z.string()),
  sourceEvidence: z.array(z.object({ field: z.string(), text: z.string() })),
});

export type PricePeriod = z.infer<typeof pricePeriodSchema>;
export type NormalizedPrice = z.infer<typeof normalizedPriceSchema>;
export type NormalizedProduct = z.infer<typeof normalizedProductSchema>;

const CURRENCY_CODES = ["USD", "CNY", "EUR", "GBP", "JPY", "HKD", "INR"] as const;

/** Symbol/word -> ISO 4217. "¥" is treated as CNY (Chinese-first product). */
const CURRENCY_ALIASES: ReadonlyArray<[RegExp, string]> = [
  [/US\$|\$|美元/, "USD"],
  [/[¥￥元]|rmb|人民币/i, "CNY"],
  [/€/, "EUR"],
  [/£/, "GBP"],
];

const FREE_PATTERN = /免费|\bfree\b/i;

export function normalizeCurrency(text: string | null | undefined): string | null {
  if (!text) return null;
  const code = text.toUpperCase().match(/\b[A-Z]{3}\b/)?.[0];
  if (code === "RMB") return "CNY";
  if (code && (CURRENCY_CODES as readonly string[]).includes(code)) return code;
  for (const [pattern, iso] of CURRENCY_ALIASES) {
    if (pattern.test(text)) return iso;
  }
  return null;
}

export function normalizeBillingPeriod(text: string | null | undefined): PricePeriod {
  if (!text) return null;
  const value = text.toLowerCase();
  if (/one[- ]?time|lifetime|\bonce\b|一次性|买断|终身/.test(value)) return "once";
  if (/year|annual|\/\s*yr\b|\byr\b|年/.test(value)) return "year";
  if (/month|\/\s*mo\b|\bmo\b|\bmon\b|月/.test(value)) return "month";
  return null;
}

function parseAmount(text: string): number | null {
  const match = text.match(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

/**
 * Parses one pricing entry. Explicit fields win over what is parsed from the
 * price string. Nothing is invented: unknown parts stay null.
 */
export function normalizePrice(entry: {
  plan: string;
  price: number | string | null;
  currency: string | null;
  billingPeriod: string | null;
}): NormalizedPrice {
  const plan = entry.plan.trim().replace(/\s+/g, " ");
  const priceText = typeof entry.price === "string" ? entry.price : "";

  let amount: number | null = null;
  if (typeof entry.price === "number") {
    amount = Number.isFinite(entry.price) && entry.price >= 0 ? entry.price : null;
  } else if (priceText) {
    amount = parseAmount(priceText);
    if (amount === null && FREE_PATTERN.test(priceText)) amount = 0;
  }

  const currency =
    amount === 0 ? null : normalizeCurrency(entry.currency) ?? normalizeCurrency(priceText);
  const period =
    amount === 0 ? null : normalizeBillingPeriod(entry.billingPeriod) ?? normalizeBillingPeriod(priceText);

  return { plan, amount, currency, period };
}

/** Trims, collapses whitespace, drops empties and case-insensitive duplicates. */
export function normalizeStringList(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const clean = value.trim().replace(/\s+/g, " ");
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function cleanNullable(value: string | null): string | null {
  const clean = value?.trim().replace(/\s+/g, " ");
  return clean ? clean : null;
}

export function normalizeExtractedData(product: Product): NormalizedProduct {
  return {
    name: product.name.trim().replace(/\s+/g, " "),
    company: cleanNullable(product.company),
    category: cleanNullable(product.category),
    pricing: product.pricing
      .map(normalizePrice)
      .filter((price) => price.plan || price.amount !== null),
    freePlan: typeof product.freePlan === "boolean" ? product.freePlan : null,
    features: normalizeStringList(product.features),
    targetUsers: normalizeStringList(product.targetUsers),
    advantages: normalizeStringList(product.advantages),
    limitations: normalizeStringList(product.limitations),
    sourceEvidence: product.sourceEvidence
      .map((item) => ({ field: item.field.trim(), text: item.text.trim().replace(/\s+/g, " ") }))
      .filter((item) => item.field && item.text),
  };
}

/** Lowest known price (free counts as 0), or null if no plan has an amount. */
export function cheapestPrice(pricing: readonly NormalizedPrice[]): NormalizedPrice | null {
  let best: NormalizedPrice | null = null;
  for (const price of pricing) {
    if (price.amount === null) continue;
    if (!best || (best.amount !== null && price.amount < best.amount)) best = price;
  }
  return best;
}
