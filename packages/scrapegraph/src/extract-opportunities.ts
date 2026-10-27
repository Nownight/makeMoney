import { hasBlockedMarkers } from "./blocked";
import { ScrapeGraphError, type ScrapeGraphClient } from "./client";
import { normalizeOpportunity, type NormalizedOpportunity } from "./normalize";
import { EXTRACTION_JSON_SCHEMA, buildExtractionPrompt, extractionResultSchema } from "./opportunity";
import { isRelevantOpportunity } from "./relevance";

export type ExtractOpportunitiesResult =
  | {
      status: "extracted";
      opportunities: NormalizedOpportunity[];
      attempts: number;
      /** Signals dropped by the domain relevance post-filter. */
      irrelevant: number;
    }
  | { status: "partial"; attempts: number; reason: string }
  | { status: "failed"; attempts: number; reason: string };

export type ExtractOptions = {
  /** User's domain: scopes the prompt and drives the relevance post-filter. */
  domain?: string | null;
  /** Report creation time, used to fill the year of month-day dates. */
  referenceDate?: Date;
};

/**
 * Extracts opportunity signals from one URL. API/network failures (after the client's
 * own retries) -> failed. Output that never passes Zod -> partial.
 */
export async function extractOpportunities(
  client: ScrapeGraphClient,
  url: string,
  options: ExtractOptions = {},
): Promise<ExtractOpportunitiesResult> {
  let attempts = 0;
  // Normal, normal again, then strict prompt (each call costs 5 credits).
  const normal = buildExtractionPrompt(options.domain);
  const prompts = [normal, normal, buildExtractionPrompt(options.domain, true)];

  for (const prompt of prompts) {
    attempts += 1;
    let json: unknown;
    let raw = "";

    try {
      const response = await client.extract({ url, prompt, schema: EXTRACTION_JSON_SCHEMA });
      json = response.json;
      raw = response.raw ?? "";
    } catch (error) {
      const reason =
        error instanceof ScrapeGraphError || error instanceof Error ? error.message : String(error);
      return { status: "failed", attempts, reason };
    }

    const parsed = extractionResultSchema.safeParse(json);
    const empty = !parsed.success || parsed.data.opportunities.length === 0;
    // Blocked/error pages: no point retrying, and never count as extracted.
    if (empty && (hasBlockedMarkers(raw) || (!parsed.success && hasBlockedMarkers(JSON.stringify(json ?? ""))))) {
      return { status: "failed", attempts, reason: "page looks blocked (anti-bot or error page)" };
    }
    if (parsed.success) {
      const all = parsed.data.opportunities.map((o) => normalizeOpportunity(o, options.referenceDate));
      const domain = options.domain?.trim();
      const opportunities = domain ? all.filter((o) => isRelevantOpportunity(o, domain)) : all;
      return {
        status: "extracted",
        opportunities,
        attempts,
        irrelevant: all.length - opportunities.length,
      };
    }
  }

  return { status: "partial", attempts, reason: "extraction output failed schema validation" };
}
