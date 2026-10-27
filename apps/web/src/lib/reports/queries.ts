import {
  fallbackQueries,
  OpenAICompatibleProvider,
  perQueryResults,
  MIN_QUERIES,
  type LLMProvider,
} from "@research/llm";
import type { ScrapeGraphClient, SearchResult } from "@research/scrapegraph";

import { llmConfigFromEnv } from "@/lib/reports/analyze-pipeline";

export type QueryPlan = { queries: string[]; source: "llm" | "fallback"; error?: string };

/** Ask for 2x the sources we keep so filtering still leaves enough, max 20. */
export function searchResultCount(sourceLimit: number): number {
  return Math.min(sourceLimit * 2, 20);
}

export function providerFromEnv(env: Record<string, string | undefined>): LLMProvider | null {
  const config = llmConfigFromEnv(env);
  return config ? new OpenAICompatibleProvider(config) : null;
}

/**
 * Expands the domain into 4-6 search queries with the LLM; on any failure
 * (no key, API error, too few queries) uses deterministic templates.
 */
export async function planQueries(
  domain: string,
  language: string | null,
  provider: LLMProvider | null,
  year = new Date().getFullYear(),
): Promise<QueryPlan> {
  if (provider) {
    try {
      const { queries } = await provider.expandQueries(domain, language);
      if (queries.length >= MIN_QUERIES) return { queries, source: "llm" };
      return { queries: fallbackQueries(domain, year), source: "fallback", error: "too few queries" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { queries: fallbackQueries(domain, year), source: "fallback", error: message };
    }
  }
  return { queries: fallbackQueries(domain, year), source: "fallback", error: "LLM not configured" };
}

/** Round-robin merge so each query's top results come first. */
export function interleaveResults(lists: readonly (readonly SearchResult[])[]): SearchResult[] {
  const merged: SearchResult[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let i = 0; i < longest; i += 1) {
    for (const list of lists) {
      const result = list[i];
      if (result) merged.push(result);
    }
  }
  return merged;
}

export type MultiSearchResult = {
  results: SearchResult[];
  numResultsPerQuery: number;
  failedQueries: number;
};

/**
 * Searches every query with a small numResults so the total stays around
 * `totalResults` (2 credits per result). Throws only if every query failed.
 * Dedupe happens later in filterSources.
 */
export async function searchQueries(
  client: ScrapeGraphClient,
  queries: readonly string[],
  totalResults: number,
): Promise<MultiSearchResult> {
  const numResults = perQueryResults(totalResults, queries.length);
  const settled = await Promise.allSettled(
    queries.map((query) => client.search({ query, numResults })),
  );
  const lists = settled.flatMap((entry) => (entry.status === "fulfilled" ? [entry.value.results] : []));
  const failedQueries = settled.length - lists.length;
  if (lists.length === 0) {
    const first = settled.find((entry) => entry.status === "rejected");
    throw first?.status === "rejected" ? first.reason : new Error("no queries to search");
  }
  return { results: interleaveResults(lists), numResultsPerQuery: numResults, failedQueries };
}
