import { z } from "zod";

export const chartTypeSchema = z.enum(["bar", "line", "pie", "scatter"]);

export const chartSpecSchema = z.object({
  type: chartTypeSchema,
  title: z.string(),
  description: z.string(),
  xKey: z.string(),
  yKeys: z.array(z.string()),
  sourceItemIds: z.array(z.string()),
});

/** Subjective AI judgment, integer 1-5. */
const scoreSchema = z.number().int().min(1).max(5);

export const topOpportunitySchema = z.object({
  itemIds: z.array(z.string()).min(1),
  name: z.string().min(1),
  whyNow: z.string(),
  whoFits: z.string(),
  howToStart: z.string(),
  risks: z.array(z.string()),
  scores: z.object({
    timeliness: scoreSchema,
    evidence: scoreSchema,
    feasibility: scoreSchema,
  }),
});

export const reportAnalysisSchema = z.object({
  title: z.string().min(1),
  executiveSummary: z.string().min(1),
  // Brief asks for 3-8; min 1 so thin-evidence reports still complete (prompt asks for 3-8).
  topOpportunities: z.array(topOpportunitySchema).min(1).max(8),
  trends: z.array(z.string()),
  warnings: z.array(z.string()),
  charts: z.array(chartSpecSchema).optional().default([]),
});

export type ChartSpec = z.infer<typeof chartSpecSchema>;
export type TopOpportunity = z.infer<typeof topOpportunitySchema>;
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

export type QueryExpansionResult = {
  queries: string[];
  model: string;
  usage: TokenUsage | null;
};

export interface LLMProvider {
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
  expandQueries(domain: string, language?: string | null): Promise<QueryExpansionResult>;
}

/**
 * Removes itemIds that do not exist in the input (hallucinated ids), drops
 * opportunities left without any supporting item, and adds a warning when
 * anything was dropped.
 */
export function filterUnknownItemIds(
  analysis: ReportAnalysis,
  knownIds: ReadonlySet<string>,
  warning = "部分契机或图表引用了不存在的数据条目，已自动移除。",
): { analysis: ReportAnalysis; dropped: number } {
  let dropped = 0;

  const topOpportunities = analysis.topOpportunities.flatMap((opportunity) => {
    const itemIds = opportunity.itemIds.filter((id) => knownIds.has(id));
    dropped += opportunity.itemIds.length - itemIds.length;
    return itemIds.length > 0 ? [{ ...opportunity, itemIds }] : [];
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
      topOpportunities,
      charts,
      warnings: dropped > 0 ? [...analysis.warnings, warning] : analysis.warnings,
    },
  };
}
