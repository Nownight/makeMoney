import {
  cheapestPrice,
  normalizedProductSchema,
  type NormalizedPrice,
} from "@research/scrapegraph";

import type { Json } from "@/lib/supabase/database.types";

const SOURCE_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  found: { label: "待提取", variant: "outline" },
  extracted: { label: "已提取", variant: "default" },
  partial: { label: "部分失败", variant: "secondary" },
  failed: { label: "提取失败", variant: "destructive" },
  filtered: { label: "已过滤", variant: "outline" },
};

export function sourceStatusBadge(status: string) {
  return Object.hasOwn(SOURCE_STATUS, status)
    ? SOURCE_STATUS[status]
    : { label: status, variant: "outline" as const };
}

const PERIOD_LABEL = { month: "/月", year: "/年", once: "（一次性）" } as const;

export function formatPrice(price: NormalizedPrice | null): string {
  if (!price || price.amount === null) return "—";
  if (price.amount === 0) return "免费";
  const amount = price.currency ? `${price.currency} ${price.amount}` : String(price.amount);
  return price.period ? `${amount}${PERIOD_LABEL[price.period]}` : amount;
}

export type ProductRow = {
  id: string;
  name: string;
  company: string | null;
  cheapest: string;
  freePlan: boolean | null;
  featureCount: number;
  sourceUrl: string | null;
  sourceDomain: string | null;
};

type ItemInput = { id: string; source_id: string; normalized_data: Json };
type SourceInput = { id: string; url: string; domain: string };

/** Builds table rows; items whose stored JSON no longer parses are skipped. */
export function toProductRows(items: readonly ItemInput[], sources: readonly SourceInput[]): ProductRow[] {
  const byId = new Map(sources.map((source) => [source.id, source]));
  return items.flatMap((item) => {
    const parsed = normalizedProductSchema.safeParse(item.normalized_data);
    if (!parsed.success) return [];
    const source = byId.get(item.source_id);
    return [
      {
        id: item.id,
        name: parsed.data.name,
        company: parsed.data.company,
        cheapest: formatPrice(cheapestPrice(parsed.data.pricing)),
        freePlan: parsed.data.freePlan,
        featureCount: parsed.data.features.length,
        sourceUrl: source?.url ?? null,
        sourceDomain: source?.domain ?? null,
      },
    ];
  });
}
