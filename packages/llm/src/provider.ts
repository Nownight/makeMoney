import type { z } from "zod";

import {
  buildMessages,
  buildQueryExpansionMessages,
  DEFAULT_LANGUAGE,
  type ChatMessage,
} from "./prompt";
import { cleanQueries, queryExpansionSchema } from "./queries";
import {
  filterUnknownItemIds,
  reportAnalysisSchema,
  type AnalysisInput,
  type AnalysisResult,
  type LLMProvider,
  type QueryExpansionResult,
  type ReportAnalysis,
  type TokenUsage,
} from "./schema";

export const DEFAULT_LLM_BASE_URL = "https://api.openai.com/v1";
export const RETRY_DELAYS_MS = [2000, 5000] as const;
export const REQUEST_TIMEOUT_MS = 120_000;

export class LLMError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export type OpenAICompatibleOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

type ChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Strips ```json fences some relays add despite json_object mode. */
export function parseJsonContent(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 10)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

function addUsage(total: TokenUsage | null, usage: ChatResponse["usage"]): TokenUsage | null {
  if (!usage) return total;
  const prompt = usage.prompt_tokens ?? 0;
  const completion = usage.completion_tokens ?? 0;
  return {
    promptTokens: (total?.promptTokens ?? 0) + prompt,
    completionTokens: (total?.completionTokens ?? 0) + completion,
    totalTokens: (total?.totalTokens ?? 0) + (usage.total_tokens ?? prompt + completion),
  };
}

/**
 * OpenAI Chat Completions (POST {baseUrl}/chat/completions), the API most
 * relays and DeepSeek support. Uses json_object mode, not json_schema strict.
 * Up to 2 retries (2s, 5s) on network/408/429/5xx, invalid JSON or schema
 * mismatch; validation errors are fed back to the model.
 */
export class OpenAICompatibleProvider implements LLMProvider {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly options: OpenAICompatibleOptions) {
    this.baseUrl = (options.baseUrl || DEFAULT_LLM_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
  }

  private async complete(messages: ChatMessage[]): Promise<ChatResponse> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.options.model,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMError(`network error: ${message}`, null, true);
    }

    if (!response.ok) {
      const status = response.status;
      // Relays put the useful reason in the body (e.g. unknown model).
      const detail = (await response.text().catch(() => "")).slice(0, 200);
      throw new LLMError(
        `chat completion failed with HTTP ${status}${detail ? `: ${detail}` : ""}`,
        status,
        status === 408 || status === 429 || status >= 500,
      );
    }

    try {
      return (await response.json()) as ChatResponse;
    } catch {
      throw new LLMError("invalid JSON response body", response.status, true);
    }
  }

  /**
   * Chat completion + JSON parse + Zod validation with retries; validation
   * errors are fed back to the model.
   */
  private async completeJson<T>(
    messages: ChatMessage[],
    schema: z.ZodType<T>,
    label: string,
  ): Promise<{ data: T; attempts: number; usage: TokenUsage | null }> {
    let usage: TokenUsage | null = null;

    for (let attempt = 0; ; attempt += 1) {
      let feedback: string;
      try {
        const response = await this.complete(messages);
        usage = addUsage(usage, response.usage);
        const content = response.choices?.[0]?.message?.content ?? "";

        let json: unknown;
        try {
          json = parseJsonContent(content);
        } catch {
          json = undefined;
        }

        const parsed = json === undefined ? null : schema.safeParse(json);
        if (parsed?.success) return { data: parsed.data, attempts: attempt + 1, usage };

        feedback = parsed
          ? `Your JSON did not match the required shape: ${formatZodError(parsed.error)}`
          : "Your reply was not valid JSON.";
        if (attempt < RETRY_DELAYS_MS.length) {
          messages.push(
            { role: "assistant", content: content.slice(0, 4000) },
            { role: "user", content: `${feedback} Return the corrected JSON object only.` },
          );
        }
      } catch (error) {
        if (!(error instanceof LLMError) || !error.retryable) throw error;
        feedback = error.message;
      }

      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) {
        throw new LLMError(`${label} failed after ${attempt + 1} attempts: ${feedback}`, null, false);
      }
      await this.sleep(delay);
    }
  }

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    const knownIds = new Set(input.items.map((item) => item.itemId));
    const result = await this.completeJson(buildMessages(input), reportAnalysisSchema, "analysis");
    const filtered = filterUnknownItemIds(result.data, knownIds);
    return {
      analysis: filtered.analysis,
      droppedIds: filtered.dropped,
      model: this.options.model,
      attempts: result.attempts,
      usage: result.usage,
    };
  }

  async expandQueries(domain: string, language?: string | null): Promise<QueryExpansionResult> {
    const messages = buildQueryExpansionMessages(
      domain,
      language || DEFAULT_LANGUAGE,
      new Date().getFullYear(),
    );
    const result = await this.completeJson(messages, queryExpansionSchema, "query expansion");
    return { queries: cleanQueries(result.data.queries), model: this.options.model, usage: result.usage };
  }
}

export type { ReportAnalysis };
