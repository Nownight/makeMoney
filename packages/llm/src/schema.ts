import { z } from "zod";

export const chartTypeSchema = z.enum(["bar", "line", "pie", "scatter"]);

export const reportAnalysisSchema = z.object({
  title: z.string().min(1),
  executiveSummary: z.string().min(1),
  keyFindings: z.array(z.string()).min(3).max(8),
  comparisonDimensions: z.array(z.string()),
  rankings: z.array(
    z.object({
      title: z.string(),
      metric: z.string(),
      isSubjective: z.boolean(),
      items: z.array(z.object({ itemId: z.string(), value: z.number() })),
    }),
  ),
  charts: z.array(
    z.object({
      type: chartTypeSchema,
      title: z.string(),
      description: z.string(),
      xKey: z.string(),
      yKeys: z.array(z.string()),
      sourceItemIds: z.array(z.string()),
    }),
  ),
  conclusions: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type ReportAnalysis = z.infer<typeof reportAnalysisSchema>;

/** One normalized extracted item; `data` is extracted_items.normalized_data. */
export type AnalysisInputItem = {
  itemId: string;
  sourceId: string;
  sourceUrl: string;
  domain: string;
  data: unknown;
};

export type AnalysisInput = {
  query: string;
  /** BCP 47 tag; defaults to zh-CN. */
  language?: string | null;
  items: AnalysisInputItem[];
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type AnalysisResult = {
  analysis: ReportAnalysis;
  model: string;
  attempts: number;
  /** Summed over all attempts; null when the provider returned no usage. */
  usage: TokenUsage | null;
  droppedIds: number;
};

export interface LLMProvider {
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
}

/**
 * Removes ranking items / chart ids that do not exist in the input
 * (hallucinated ids) and adds a warning when anything was dropped.
 */
export function filterUnknownItemIds(
  analysis: ReportAnalysis,
  knownIds: ReadonlySet<string>,
  warning = "部分排名或图表引用了不存在的数据条目，已自动移除。",
): { analysis: ReportAnalysis; dropped: number } {
  let dropped = 0;

  const rankings = analysis.rankings.map((ranking) => {
    const items = ranking.items.filter((item) => knownIds.has(item.itemId));
    dropped += ranking.items.length - items.length;
    return { ...ranking, items };
  });

  const charts = analysis.charts.map((chart) => {
    const sourceItemIds = chart.sourceItemIds.filter((id) => knownIds.has(id));
    dropped += chart.sourceItemIds.length - sourceItemIds.length;
    return { ...chart, sourceItemIds };
  });

  return {
    dropped,
    analysis: {
      ...analysis,
      rankings,
      charts,
      warnings: dropped > 0 ? [...analysis.warnings, warning] : analysis.warnings,
    },
  };
}
