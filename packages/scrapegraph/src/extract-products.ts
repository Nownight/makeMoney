import { hasBlockedMarkers } from "./blocked";
import { ScrapeGraphError, type ScrapeGraphClient } from "./client";
import { normalizeExtractedData, type NormalizedProduct } from "./normalize";
import {
  EXTRACTION_JSON_SCHEMA,
  EXTRACTION_PROMPT,
  STRICT_EXTRACTION_PROMPT,
  extractionResultSchema,
} from "./product";

export type ExtractProductsResult =
  | { status: "extracted"; products: NormalizedProduct[]; attempts: number }
  | { status: "partial"; attempts: number; reason: string }
  | { status: "failed"; attempts: number; reason: string };

/** Normal, normal again, then strict prompt (each call costs 5 credits). */
const ATTEMPT_PROMPTS = [EXTRACTION_PROMPT, EXTRACTION_PROMPT, STRICT_EXTRACTION_PROMPT];

/**
 * Extracts products from one URL. API/network failures (after the client's
 * own retries) -> failed. Output that never passes Zod -> partial.
 */
export async function extractProducts(
  client: ScrapeGraphClient,
  url: string,
): Promise<ExtractProductsResult> {
  let attempts = 0;

  for (const prompt of ATTEMPT_PROMPTS) {
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
    const empty = !parsed.success || parsed.data.products.length === 0;
    // Blocked/error pages: no point retrying, and never count as extracted.
    if (empty && (hasBlockedMarkers(raw) || (!parsed.success && hasBlockedMarkers(JSON.stringify(json ?? ""))))) {
      return { status: "failed", attempts, reason: "page looks blocked (anti-bot or error page)" };
    }
    if (parsed.success) {
      return {
        status: "extracted",
        products: parsed.data.products.map(normalizeExtractedData),
        attempts,
      };
    }
  }

  return { status: "partial", attempts, reason: "extraction output failed schema validation" };
}
