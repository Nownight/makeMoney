import type { z } from "zod";

import {
  extractResponseSchema,
  searchResponseSchema,
  type ExtractResponse,
  type SearchResponse,
} from "./schema";

/**
 * Minimal server-only adapter for the ScrapeGraphAI managed API (v2).
 *
 * We call the documented REST endpoint with fetch instead of the
 * `scrapegraph-js` SDK: the SDK is a thin fetch wrapper around the same
 * endpoint, and calling it directly keeps us dependency-free and lets us own
 * retries and Zod validation at the boundary.
 *
 * Docs: https://docs.scrapegraphai.com/api-reference/endpoint/search
 * Cost: 2 credits per result without `prompt` (we never send one)
 *       https://docs.scrapegraphai.com/services/search#pricing
 */
export const SGAI_BASE_URL = "https://v2-api.scrapegraphai.com/api";

const RETRY_DELAYS_MS = [2000, 5000] as const;
const REQUEST_TIMEOUT_MS = 60_000;

export type SearchParams = {
  query: string;
  /** 1..20, per the API. */
  numResults: number;
};

export type ExtractParams = {
  url: string;
  prompt: string;
  /** JSON Schema the LLM output is constrained to. */
  schema: Record<string, unknown>;
};

export type ScrapeGraphClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

export class ScrapeGraphError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ScrapeGraphError";
  }
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function createScrapeGraphClient(options: ScrapeGraphClientOptions) {
  const baseUrl = options.baseUrl ?? SGAI_BASE_URL;
  const fetchImpl = options.fetch ?? fetch;
  const sleep = options.sleep ?? defaultSleep;

  async function postOnce<T>(
    path: string,
    payload: Record<string, unknown>,
    schema: z.ZodType<T>,
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "SGAI-APIKEY": options.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ScrapeGraphError(`network error: ${message}`, null, true);
    }

    if (!response.ok) {
      throw new ScrapeGraphError(
        `${path} failed with HTTP ${response.status}`,
        response.status,
        isRetryableStatus(response.status),
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ScrapeGraphError("invalid JSON response", response.status, false);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ScrapeGraphError("unexpected response shape", response.status, false);
    }

    return parsed.data;
  }

  /** Up to 2 retries (2s, 5s) on network/408/429/5xx errors. */
  async function post<T>(
    path: string,
    payload: Record<string, unknown>,
    schema: z.ZodType<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await postOnce(path, payload, schema);
      } catch (error) {
        const delay = RETRY_DELAYS_MS[attempt];
        if (
          !(error instanceof ScrapeGraphError) ||
          !error.retryable ||
          delay === undefined
        ) {
          throw error;
        }
        await sleep(delay);
      }
    }
  }

  return {
    search(params: SearchParams): Promise<SearchResponse> {
      return post(
        "/search",
        {
          query: params.query,
          numResults: Math.min(20, Math.max(1, params.numResults)),
          format: "markdown",
          // HTML only: PDFs cost extra credits per processed page.
          allowedTypes: ["text/html"],
        },
        searchResponseSchema,
      );
    },

    /**
     * POST /api/extract with a prompt + JSON schema (5 credits per call).
     * Docs: https://docs.scrapegraphai.com/api-reference/endpoint/extract
     * Pricing: https://docs.scrapegraphai.com/services/extract#pricing
     * Only the transport envelope is validated here; callers validate `json`.
     */
    extract(params: ExtractParams): Promise<ExtractResponse> {
      return post(
        "/extract",
        {
          url: params.url,
          prompt: params.prompt,
          schema: params.schema,
          allowedTypes: ["text/html"],
        },
        extractResponseSchema,
      );
    },
  };
}

export type ScrapeGraphClient = ReturnType<typeof createScrapeGraphClient>;
