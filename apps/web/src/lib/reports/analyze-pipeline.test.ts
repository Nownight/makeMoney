import { describe, expect, it } from "vitest";

import { llmConfigFromEnv, toAnalysisItems } from "@/lib/reports/analyze-pipeline";

describe("llmConfigFromEnv", () => {
  it("requires key and model, defaults the base URL", () => {
    expect(llmConfigFromEnv({})).toBeNull();
    expect(llmConfigFromEnv({ OPENAI_API_KEY: "sk" })).toBeNull();
    expect(llmConfigFromEnv({ ANALYSIS_MODEL: "m" })).toBeNull();
    expect(llmConfigFromEnv({ OPENAI_API_KEY: "sk", ANALYSIS_MODEL: "m" })).toEqual({
      apiKey: "sk",
      model: "m",
      baseUrl: "https://api.openai.com/v1",
    });
    expect(
      llmConfigFromEnv({ OPENAI_API_KEY: "sk", ANALYSIS_MODEL: "deepseek-chat", LLM_BASE_URL: " https://relay.cn/v1 " }),
    ).toMatchObject({ baseUrl: "https://relay.cn/v1" });
  });
});

describe("toAnalysisItems", () => {
  it("maps rows to provider input", () => {
    expect(
      toAnalysisItems([
        { id: "i1", source_id: "s1", normalized_data: { name: "A" }, sources: { url: "https://a.com", domain: "a.com" } },
        { id: "i2", source_id: "s2", normalized_data: null, sources: null },
      ]),
    ).toEqual([
      { itemId: "i1", sourceId: "s1", sourceUrl: "https://a.com", domain: "a.com", data: { name: "A" } },
      { itemId: "i2", sourceId: "s2", sourceUrl: "", domain: "", data: null },
    ]);
  });
});
