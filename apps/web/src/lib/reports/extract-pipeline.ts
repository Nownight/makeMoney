import {
  extractProducts,
  SCHEMA_VERSION,
  type ExtractProductsResult,
  type ScrapeGraphClient,
} from "@research/scrapegraph";

import { logError, logEvent } from "@/lib/logger";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export const EXTRACT_CONCURRENCY = 3;
export const EXTRACT_PROGRESS_START = 20;
export const EXTRACT_PROGRESS_END = 65;
export const NORMALIZE_PROGRESS = 70;
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Runs `worker` over `items` with at most `limit` in flight; keeps order. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function run(): Promise<void> {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, run));
  return results;
}

/** Linear 20 -> 65 as sources finish. */
export function extractionProgress(done: number, total: number): number {
  if (total <= 0) return EXTRACT_PROGRESS_END;
  const ratio = Math.min(1, Math.max(0, done / total));
  return Math.round(
    EXTRACT_PROGRESS_START + ratio * (EXTRACT_PROGRESS_END - EXTRACT_PROGRESS_START),
  );
}

export type ExtractSourceInput = { id: string; url: string };

export type CachedItem = {
  entity_name: string;
  entity_type: string;
  normalized_data: Json;
  confidence: number | null;
};

type SourceOutcome =
  | { status: "extracted"; items: CachedItem[]; cached: boolean }
  | { status: "partial" | "failed"; reason: string };

export function toItems(result: ExtractProductsResult): SourceOutcome {
  if (result.status !== "extracted") return { status: result.status, reason: result.reason };
  return {
    status: "extracted",
    cached: false,
    items: result.products.map((product) => ({
      entity_name: product.name,
      entity_type: "product",
      normalized_data: product,
      confidence: null,
    })),
  };
}

/** Reuses items extracted from the same normalized URL within 24h. */
async function findCachedItems(admin: AdminClient, url: string): Promise<CachedItem[] | null> {
  const since = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data, error } = await admin
    .from("extracted_items")
    .select("entity_name, entity_type, normalized_data, confidence, source_id, created_at, sources!inner(url)")
    .eq("sources.url", url)
    .eq("schema_version", SCHEMA_VERSION)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) return null;
  // Only reuse the rows of the most recent source.
  const sourceId = data[0].source_id;
  return data
    .filter((row) => row.source_id === sourceId)
    .map(({ entity_name, entity_type, normalized_data, confidence }) => ({
      entity_name,
      entity_type,
      normalized_data,
      confidence,
    }));
}

export type ExtractionSummary = { total: number; extracted: number; itemCount: number };

/**
 * extracting (20 -> 65, per source, 3 in parallel) -> normalizing (70).
 * Per-source failures only mark that source partial/failed.
 */
export async function runExtraction(
  admin: AdminClient,
  client: ScrapeGraphClient,
  reportId: string,
  sources: readonly ExtractSourceInput[],
): Promise<ExtractionSummary> {
  const startedAt = Date.now();
  let done = 0;

  await admin
    .from("reports")
    .update({ status: "extracting", progress: EXTRACT_PROGRESS_START })
    .eq("id", reportId);

  const outcomes = await mapWithConcurrency(sources, EXTRACT_CONCURRENCY, async (source) => {
    let outcome: SourceOutcome;
    try {
      const cached = await findCachedItems(admin, source.url);
      outcome = cached
        ? { status: "extracted", items: cached, cached: true }
        : toItems(await extractProducts(client, source.url));
    } catch (error) {
      outcome = { status: "failed", reason: error instanceof Error ? error.message : String(error) };
    }

    if (outcome.status === "extracted" && outcome.items.length > 0) {
      const { error } = await admin.from("extracted_items").insert(
        outcome.items.map((item) => ({
          ...item,
          report_id: reportId,
          source_id: source.id,
          schema_version: SCHEMA_VERSION,
        })),
      );
      if (error) outcome = { status: "failed", reason: `save failed: ${error.message}` };
    }

    await admin
      .from("sources")
      .update({ status: outcome.status, fetched_at: new Date().toISOString() })
      .eq("id", source.id);

    if (outcome.status === "extracted") {
      logEvent("info", "report.extract.source", {
        reportId,
        stage: "extracting",
        sourceId: source.id,
        itemCount: outcome.items.length,
        cached: outcome.cached,
      });
    } else {
      logError("report.extract.source_failed", outcome.reason, {
        reportId,
        stage: "extracting",
        sourceId: source.id,
        status: outcome.status,
      });
    }

    done += 1;
    await admin
      .from("reports")
      .update({ progress: extractionProgress(done, sources.length) })
      .eq("id", reportId);

    return outcome;
  });

  // Normalization already happened per source; this marks the stage boundary.
  await admin
    .from("reports")
    .update({ status: "normalizing", progress: NORMALIZE_PROGRESS })
    .eq("id", reportId);

  const summary: ExtractionSummary = {
    total: sources.length,
    extracted: outcomes.filter((o) => o.status === "extracted").length,
    itemCount: outcomes.reduce((n, o) => n + (o.status === "extracted" ? o.items.length : 0), 0),
  };

  logEvent("info", "report.extract.completed", {
    reportId,
    stage: "normalizing",
    ...summary,
    durationMs: Date.now() - startedAt,
  });

  return summary;
}
