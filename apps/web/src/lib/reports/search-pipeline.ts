import {
  createScrapeGraphClient,
  filterSources,
  type FilteredSource,
} from "@research/scrapegraph";

import { runAnalysis } from "@/lib/reports/analyze-pipeline";
import { runExtraction } from "@/lib/reports/extract-pipeline";
import { logError, logEvent } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export const MIN_USABLE_SOURCES = 2;

/** Ask for 2x the sources we keep so filtering still leaves enough, max 20. */
export function searchResultCount(sourceLimit: number): number {
  return Math.min(sourceLimit * 2, 20);
}

type ReportForSearch = {
  id: string;
  query: string;
  sourceLimit: number;
};

/**
 * Temporary synchronous pipeline until the Phase 7 worker exists.
 *
 * queued -> searching (10) -> extracting (20..65) -> normalizing (70) ->
 * analyzing (80) -> completed (100).
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

  const client = createScrapeGraphClient({ apiKey });
  let sources: FilteredSource[];
  try {
    const response = await client.search({
      query: report.query,
      numResults: searchResultCount(report.sourceLimit),
    });
    sources = filterSources(response.results, report.query, report.sourceLimit);
    logEvent("info", "report.search.results", {
      reportId: report.id,
      stage: "searching",
      rawCount: response.results.length,
      keptCount: sources.length,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    await fail("来源搜索失败，请稍后重试", error);
    return;
  }

  if (sources.length < MIN_USABLE_SOURCES) {
    await fail(`可用来源不足（仅找到 ${sources.length} 个），请换个更具体的主题`);
    return;
  }

  const fetchedAt = new Date().toISOString();
  const { data: inserted, error: insertError } = await admin.from("sources").insert(
    sources.map((source) => ({
      report_id: report.id,
      url: source.url,
      title: source.title,
      domain: source.domain,
      snippet: source.snippet,
      search_rank: source.searchRank,
      quality_score: source.qualityScore,
      fetched_at: fetchedAt,
      raw_metadata: { provider: "scrapegraphai" },
    })),
  ).select("id, url");

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

  const summary = await runExtraction(admin, client, report.id, inserted);

  if (summary.extracted === 0) {
    await fail("未能从任何来源提取到数据，请稍后重试");
    return;
  }

  await runAnalysis(admin, report);
}
