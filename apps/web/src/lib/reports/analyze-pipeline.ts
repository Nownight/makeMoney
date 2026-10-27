import {
  DEFAULT_LLM_BASE_URL,
  OpenAICompatibleProvider,
  type AnalysisInputItem,
  type LLMProvider,
} from "@research/llm";

import { logError, logEvent } from "@/lib/logger";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export const ANALYZE_PROGRESS = 80;

export type LLMConfig = { apiKey: string; model: string; baseUrl: string };

/** Reads LLM settings; null when OPENAI_API_KEY or ANALYSIS_MODEL is missing. */
export function llmConfigFromEnv(env: Record<string, string | undefined>): LLMConfig | null {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.ANALYSIS_MODEL?.trim();
  if (!apiKey || !model) return null;
  return { apiKey, model, baseUrl: env.LLM_BASE_URL?.trim() || DEFAULT_LLM_BASE_URL };
}

type ItemRow = {
  id: string;
  source_id: string;
  normalized_data: Json;
  sources: { url: string; domain: string } | null;
};

export function toAnalysisItems(rows: readonly ItemRow[]): AnalysisInputItem[] {
  return rows.map((row) => ({
    itemId: row.id,
    sourceId: row.source_id,
    sourceUrl: row.sources?.url ?? "",
    domain: row.sources?.domain ?? "",
    data: row.normalized_data,
  }));
}

/**
 * analyzing (80) -> completed (100). Rendering (Phase 6) is not built yet,
 * so the report is completed once the analysis is saved. On any failure the
 * report becomes failed; extracted data stays. Never throws.
 */
export async function runAnalysis(
  admin: AdminClient,
  report: { id: string; query: string },
  provider?: LLMProvider,
): Promise<void> {
  const startedAt = Date.now();

  async function fail(errorMessage: string, error?: unknown): Promise<void> {
    logError("report.analyze.failed", error ?? errorMessage, {
      reportId: report.id,
      stage: "analyzing",
      durationMs: Date.now() - startedAt,
    });
    await admin
      .from("reports")
      .update({ status: "failed", error_message: errorMessage })
      .eq("id", report.id);
  }

  const config = llmConfigFromEnv(process.env);
  const llm = provider ?? (config ? new OpenAICompatibleProvider(config) : null);
  if (!llm) {
    await fail("分析服务未配置，请联系管理员");
    return;
  }

  await admin
    .from("reports")
    .update({ status: "analyzing", progress: ANALYZE_PROGRESS })
    .eq("id", report.id);

  const [{ data: meta }, { data: rows, error: rowsError }] = await Promise.all([
    admin.from("reports").select("title, language").eq("id", report.id).maybeSingle(),
    admin
      .from("extracted_items")
      .select("id, source_id, normalized_data, sources(url, domain)")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true }),
  ]);

  if (rowsError || !rows || rows.length === 0) {
    await fail("没有可供分析的数据，请稍后重试", rowsError?.message);
    return;
  }

  try {
    const result = await llm.analyze({
      query: report.query,
      language: meta?.language,
      items: toAnalysisItems(rows),
    });

    logEvent("info", "report.analyze.completed", {
      reportId: report.id,
      stage: "analyzing",
      model: result.model,
      attempts: result.attempts,
      droppedIds: result.droppedIds,
      promptTokens: result.usage?.promptTokens ?? null,
      completionTokens: result.usage?.completionTokens ?? null,
      totalTokens: result.usage?.totalTokens ?? null,
      itemCount: rows.length,
      durationMs: Date.now() - startedAt,
    });

    const { error } = await admin
      .from("reports")
      .update({
        title: meta?.title ?? result.analysis.title,
        executive_summary: result.analysis.executiveSummary,
        analysis_json: result.analysis,
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", report.id);

    if (error) await fail("保存分析结果失败，请稍后重试", error.message);
  } catch (error) {
    await fail("AI 分析失败，请稍后重试", error);
  }
}
