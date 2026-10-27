import {
  createScrapeGraphClient,
  rankSources,
  type FilteredSource,
} from "@research/scrapegraph";

import { runAnalysis } from "@/lib/reports/analyze-pipeline";
import { runExtraction } from "@/lib/reports/extract-pipeline";
import {
  planQueries,
  providerFromEnv,
  searchQueries,
  searchResultCount,
} from "@/lib/reports/queries";
import { logError, logEvent } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export const MIN_USABLE_SOURCES = 2;

export { searchResultCount };

type ReportForSearch = {
  id: string;
  query: string;
  sourceLimit: number;
  /** ISO creation time; month-day dates get their year from it. */
  createdAt?: string;
};

/** Max extra candidates tried when extractions fail (each may cost 5-15 credits). */
export function maxBackfill(sourceLimit: number): number {
  return Math.max(0, sourceLimit);
}

/** Splits ranked candidates into the initial sources and a bounded backfill queue. */
export function splitCandidates<T>(ranked: readonly T[], sourceLimit: number): { primary: T[]; backups: T[] } {
  return {
    primary: ranked.slice(0, sourceLimit),
    backups: ranked.slice(sourceLimit, sourceLimit + maxBackfill(sourceLimit)),
  };
}

/**
 * Temporary synchronous pipeline until the Phase 7 worker exists.
 *
 * The domain is expanded into 4-6 queries (LLM, or templates on failure);
 * each is searched with a small numResults, results are merged and filtered.
 *
 * queued -> searching (10) -> extracting (20..65) -> normalizing (70) ->
 * analyzing (80) -> completed (100).
 * Failed/empty extractions are backfilled from the next ranked candidates.
 * On search API error, < 2 usable sources, no source extracted or analysis
 * failure: failed + error_message (saved sources/items are kept).
 *
 * Never throws: every failure is recorded on the report and logged.
 */
export async function runSourceSearch(report: ReportForSearch): Promise<void> {
  const maybeAdmin = createAdminClient();

  if (!maybeAdmin) {
    logEvent("warn", "report.search.skipped", {
      reportId: report.id,
      stage: "searching",
      reason: "SUPABASE_SERVICE_ROLE_KEY missing",
    });
    return;
  }

  const admin = maybeAdmin;
  const startedAt = Date.now();

  async function fail(errorMessage: string, error?: unknown): Promise<void> {
    logError("report.search.failed", error ?? errorMessage, {
      reportId: report.id,
      stage: "searching",
      durationMs: Date.now() - startedAt,
    });
    await admin
      .from("reports")
      .update({ status: "failed", error_message: errorMessage })
      .eq("id", report.id);
  }

  const apiKey = process.env.SGAI_API_KEY;
  if (!apiKey) {
    await fail("搜索服务未配置，请联系管理员");
    return;
  }

  await admin
    .from("reports")
    .update({ status: "searching", progress: 10, error_message: null })
    .eq("id", report.id);

  const plan = await planQueries(report.query, null, providerFromEnv(process.env));
  logEvent(plan.source === "llm" ? "info" : "warn", "report.search.queries", {
    reportId: report.id,
    stage: "searching",
    source: plan.source,
    queries: plan.queries.join(" | "),
    ...(plan.error ? { reason: plan.error.slice(0, 200) } : {}),
  });
  await admin.from("reports").update({ search_queries: plan.queries }).eq("id", report.id);

  const client = createScrapeGraphClient({ apiKey });
  let sources: FilteredSource[];
  let backups: FilteredSource[];
  try {
    const search = await searchQueries(client, plan.queries, searchResultCount(report.sourceLimit));
    ({ primary: sources, backups } = splitCandidates(
      rankSources(search.results, report.query),
      report.sourceLimit,
    ));
    logEvent("info", "report.search.results", {
      reportId: report.id,
      stage: "searching",
      queryCount: plan.queries.length,
      numResultsPerQuery: search.numResultsPerQuery,
      failedQueries: search.failedQueries,
      rawCount: search.results.length,
      keptCount: sources.length,
      backupCount: backups.length,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    await fail("来源搜索失败，请稍后重试", error);
    return;
  }

  if (sources.length < MIN_USABLE_SOURCES) {
    await fail(`可用来源不足（仅找到 ${sources.length} 个），请换个更具体的领域`);
    return;
  }

  const fetchedAt = new Date().toISOString();
  const toRow = (source: FilteredSource) => ({
    report_id: report.id,
    url: source.url,
    title: source.title,
    domain: source.domain,
    snippet: source.snippet,
    search_rank: source.searchRank,
    quality_score: source.qualityScore,
    published_at: source.publishedAt,
    fetched_at: fetchedAt,
    raw_metadata: { provider: "scrapegraphai" },
  });
  const { data: inserted, error: insertError } = await admin
    .from("sources")
    .insert(sources.map(toRow))
    .select("id, url");

  if (insertError || !inserted) {
    await fail("保存来源失败，请稍后重试", insertError?.message);
    return;
  }

  logEvent("info", "report.search.completed", {
    reportId: report.id,
    stage: "searching",
    sourceCount: sources.length,
    durationMs: Date.now() - startedAt,
  });

  // Backup candidates are saved only when actually tried.
  async function backfill(): Promise<{ id: string; url: string } | null> {
    const next = backups.shift();
    if (!next) return null;
    const { data, error } = await admin.from("sources").insert(toRow(next)).select("id, url").single();
    if (error || !data) {
      logError("report.extract.backfill_failed", error?.message ?? "no row", { reportId: report.id });
      return null;
    }
    return data;
  }

  const createdAt = report.createdAt ? new Date(report.createdAt) : new Date();
  const summary = await runExtraction(
    admin,
    client,
    {
      reportId: report.id,
      query: report.query,
      referenceDate: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
    },
    inserted,
    backfill,
  );

  if (summary.extracted === 0) {
    await fail("未能从任何来源提取到数据，请稍后重试");
    return;
  }

  await runAnalysis(admin, report);
}
