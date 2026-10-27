import { z } from "zod";

export const MIN_QUERIES = 4;
export const MAX_QUERIES = 6;

export const queryExpansionSchema = z.object({
  queries: z.array(z.string().trim().min(1)).min(MIN_QUERIES).max(MAX_QUERIES),
});

/** Suffixes for the deterministic fallback, one per angle. */
const FALLBACK_SUFFIXES = [
  "新产品 发布",
  "融资 投资",
  "需求 痛点",
  "变现 案例",
  "政策 趋势",
] as const;

/** Deterministic fallback when the LLM is unavailable: domain + angle + year. */
export function fallbackQueries(domain: string, year: number): string[] {
  const clean = domain.trim().replace(/\s+/g, " ");
  return FALLBACK_SUFFIXES.map((suffix) => `${clean} ${suffix} ${year}`);
}

/** Trims, dedupes (case-insensitive) and caps queries. */
export function cleanQueries(queries: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const query of queries) {
    const clean = query.trim().replace(/\s+/g, " ");
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result.slice(0, MAX_QUERIES);
}

/**
 * Splits a total result budget across queries (at least 1 each, max 20 per
 * search call). E.g. 10 results over 5 queries -> 2 per query.
 */
export function perQueryResults(total: number, queryCount: number): number {
  if (queryCount <= 0) return 0;
  return Math.min(20, Math.max(1, Math.floor(total / queryCount)));
}
