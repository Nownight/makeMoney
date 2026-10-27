import { z } from "zod";

import { OPPORTUNITY_TYPES, levelSchema, type Opportunity } from "./opportunity";

export const pricePeriodSchema = z.enum(["month", "year", "once"]).nullable();

export const normalizedPriceSchema = z.object({
  plan: z.string(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  period: pricePeriodSchema,
});

/** Shape stored in extracted_items.normalized_data. */
export type PricePeriod = z.infer<typeof pricePeriodSchema>;
export type NormalizedPrice = z.infer<typeof normalizedPriceSchema>;

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

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Normalizes a date to YYYY-MM-DD, or null when unknown, partial (no day)
 * or invalid. Accepts ISO dates/datetimes, 2026/3/5, 2026.3.5, 2026年3月5日.
 */
export function normalizeDate(text: string | null | undefined): string | null {
  const match = text?.trim().match(/^(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})\s*日?/);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

export const normalizedOpportunitySchema = z.object({
  title: z.string(),
  type: z.enum(OPPORTUNITY_TYPES),
  summary: z.string(),
  signals: z.array(z.string()),
  evidence: z.array(z.object({ field: z.string(), text: z.string() })),
  eventDate: z.string().nullable(),
  monetization: z.array(z.string()),
  entryBarrier: levelSchema,
  competition: levelSchema,
  targetAudience: z.array(z.string()),
});

export type NormalizedOpportunity = z.infer<typeof normalizedOpportunitySchema>;

const collapse = (value: string) => value.trim().replace(/\s+/g, " ");

export function normalizeOpportunity(opportunity: Opportunity): NormalizedOpportunity {
  return {
    title: collapse(opportunity.title),
    type: opportunity.type,
    summary: collapse(opportunity.summary),
    signals: normalizeStringList(opportunity.signals),
    evidence: opportunity.evidence
      .map((item) => ({ field: item.field.trim(), text: collapse(item.text) }))
      .filter((item) => item.field && item.text),
    eventDate: normalizeDate(opportunity.eventDate),
    monetization: normalizeStringList(opportunity.monetization),
    entryBarrier: opportunity.entryBarrier,
    competition: opportunity.competition,
    targetAudience: normalizeStringList(opportunity.targetAudience),
  };
}
