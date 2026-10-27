import {
  normalizedOpportunitySchema,
  OPPORTUNITY_TYPE_LABELS,
  type Level,
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

const LEVEL_LABEL = { low: "低", medium: "中", high: "高" } as const;

export function levelLabel(level: Level): string {
  return level ? LEVEL_LABEL[level] : "未知";
}

export type OpportunityRow = {
  id: string;
  title: string;
  typeLabel: string;
  eventDate: string | null;
  barrier: string;
  competition: string;
  sourceUrl: string | null;
  sourceDomain: string | null;
};

type ItemInput = { id: string; source_id: string; normalized_data: Json };
type SourceInput = { id: string; url: string; domain: string };

/** Builds table rows; items whose stored JSON no longer parses are skipped. */
export function toOpportunityRows(
  items: readonly ItemInput[],
  sources: readonly SourceInput[],
): OpportunityRow[] {
  const byId = new Map(sources.map((source) => [source.id, source]));
  return items.flatMap((item) => {
    const parsed = normalizedOpportunitySchema.safeParse(item.normalized_data);
    if (!parsed.success) return [];
    const source = byId.get(item.source_id);
    return [
      {
        id: item.id,
        title: parsed.data.title,
        typeLabel: OPPORTUNITY_TYPE_LABELS[parsed.data.type],
        eventDate: parsed.data.eventDate,
        barrier: levelLabel(parsed.data.entryBarrier),
        competition: levelLabel(parsed.data.competition),
        sourceUrl: source?.url ?? null,
        sourceDomain: source?.domain ?? null,
      },
    ];
  });
}

/** reports.search_queries is jsonb; anything but a string array reads as []. */
export function parseSearchQueries(value: Json | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

/** Unique source links behind an opportunity's itemIds, in citation order. */
export function supportingSources(
  itemIds: readonly string[],
  rows: readonly OpportunityRow[],
): Array<{ url: string; domain: string }> {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const links: Array<{ url: string; domain: string }> = [];
  for (const id of itemIds) {
    const row = byId.get(id);
    if (!row?.sourceUrl || seen.has(row.sourceUrl)) continue;
    seen.add(row.sourceUrl);
    links.push({ url: row.sourceUrl, domain: row.sourceDomain ?? row.sourceUrl });
  }
  return links;
}
