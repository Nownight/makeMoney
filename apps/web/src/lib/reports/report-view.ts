import { OPPORTUNITY_TYPE_LABELS, type OpportunityType } from "@research/scrapegraph";
import type { TopOpportunity } from "@research/llm";

import type { OpportunityRow } from "@/lib/reports/opportunities";

/** Pipeline states where the page should show progress and auto-refresh. */
export function isRunning(status: string): boolean {
  return ["searching", "extracting", "normalizing", "analyzing", "rendering"].includes(status);
}

export type TimelinePoint = { date: string; count: number };

/** Dated signals per day (YYYY-MM-DD), ascending. Undated signals are excluded. */
export function signalTimeline(rows: readonly Pick<OpportunityRow, "eventDate">[]): TimelinePoint[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(row.eventDate)) continue;
    counts.set(row.eventDate, (counts.get(row.eventDate) ?? 0) + 1);
  }
  return [...counts]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type TypeShare = { type: OpportunityType; label: string; count: number; share: number };

/** Signal count per type, largest first; share is 0..1. */
export function typeDistribution(rows: readonly Pick<OpportunityRow, "type">[]): TypeShare[] {
  const counts = new Map<OpportunityType, number>();
  for (const row of rows) counts.set(row.type, (counts.get(row.type) ?? 0) + 1);
  const total = rows.length || 1;
  return [...counts]
    .map(([type, count]) => ({ type, label: OPPORTUNITY_TYPE_LABELS[type], count, share: count / total }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export type ScatterPoint = {
  index: number;
  name: string;
  x: number;
  y: number;
  size: number;
};

/**
 * Timeliness (x) × feasibility (y), bubble size = evidence. Opportunities on
 * the same cell are nudged apart so every bubble stays visible.
 */
export function opportunityScatter(opportunities: readonly TopOpportunity[]): ScatterPoint[] {
  const seen = new Map<string, number>();
  return opportunities.map((opportunity, index) => {
    const { timeliness, feasibility, evidence } = opportunity.scores;
    const key = `${timeliness}:${feasibility}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    const angle = n * 2.4;
    const offset = n === 0 ? 0 : 0.18;
    return {
      index: index + 1,
      name: opportunity.name,
      x: timeliness + Math.cos(angle) * offset,
      y: feasibility + Math.sin(angle) * offset,
      size: evidence,
    };
  });
}

/** Mean of the three 1-5 scores, one decimal. */
export function overallScore(scores: TopOpportunity["scores"]): number {
  return Math.round(((scores.timeliness + scores.evidence + scores.feasibility) / 3) * 10) / 10;
}

/** Splits signals into dated (newest first) and undated. */
export function splitByDate<T extends Pick<OpportunityRow, "eventDate">>(
  rows: readonly T[],
): { dated: T[]; undated: T[] } {
  const dated = rows.filter((row) => row.eventDate).sort((a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? ""));
  return { dated, undated: rows.filter((row) => !row.eventDate) };
}
