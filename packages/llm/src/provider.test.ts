import { describe, expect, it, vi } from "vitest";

import { exampleAnalysis, exampleItems } from "./__fixtures__/example-items";
import { LLMError, OpenAICompatibleProvider, parseJsonContent } from "./provider";

function chat(content: string, usage = { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }], usage }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function setup(responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  const sleep = vi.fn(async (_ms: number) => {});
  const provider = new OpenAICompatibleProvider({
    apiKey: "sk-test",
    model: "test-model",
    baseUrl: "https://relay.example.com/v1/",
    fetch: fetchMock,
    sleep,
  });
  return { provider, fetchMock, sleep };
}

const input = { query: "AI 编程工具", items: exampleItems };

describe("OpenAICompatibleProvider", () => {
  it("posts a chat completion and returns validated output", async () => {
    const { provider, fetchMock } = setup([chat(JSON.stringify(exampleAnalysis))]);
    const result = await provider.analyze(input);

    expect(result).toMatchObject({ attempts: 1, model: "test-model", droppedIds: 0 });
    expect(result.analysis.title).toBe(exampleAnalysis.title);
    expect(result.usage).toEqual({ promptTokens: 100, completionTokens: 50, totalTokens: 150 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://relay.example.com/v1/chat/completions");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer sk-test");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ model: "test-model", response_format: { type: "json_object" } });
    expect(JSON.stringify(body.messages)).not.toContain("sk-test");
  });

  it("retries invalid JSON with feedback, then succeeds", async () => {
    const { provider, fetchMock, sleep } = setup([
      chat("not json"),
      chat("```json\n" + JSON.stringify(exampleAnalysis) + "\n```"),
    ]);
    const result = await provider.analyze(input);

    expect(result.attempts).toBe(2);
    expect(result.usage?.totalTokens).toBe(300);
    expect(sleep).toHaveBeenCalledWith(2000);
    const retryMessages = JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).messages;
    expect(retryMessages.at(-1).content).toMatch(/not valid JSON/);
  });

  it("feeds Zod errors back and gives up after 3 attempts", async () => {
    const bad = JSON.stringify({ ...exampleAnalysis, keyFindings: [] });
    const { provider, fetchMock } = setup([chat(bad), chat(bad), chat(bad)]);
    await expect(provider.analyze(input)).rejects.toThrow(/after 3 attempts/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryMessages = JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).messages;
    expect(retryMessages.at(-1).content).toMatch(/keyFindings/);
  });

  it("does not retry 4xx and retries 5xx", async () => {
    const a = setup([new Response("no", { status: 401 })]);
    await expect(a.provider.analyze(input)).rejects.toMatchObject({ status: 401, retryable: false });
    expect(a.fetchMock).toHaveBeenCalledTimes(1);

    const b = setup([new Response("", { status: 502 }), chat(JSON.stringify(exampleAnalysis))]);
    await expect(b.provider.analyze(input)).resolves.toMatchObject({ attempts: 2 });
  });

  it("drops hallucinated ids", async () => {
    const withFake = {
      ...exampleAnalysis,
      rankings: [{ ...exampleAnalysis.rankings[0], items: [{ itemId: "fake", value: 1 }] }],
    };
    const { provider } = setup([chat(JSON.stringify(withFake))]);
    const result = await provider.analyze(input);
    expect(result.droppedIds).toBe(1);
    expect(result.analysis.rankings[0].items).toEqual([]);
  });

  it("is an LLMError for network failures", () => {
    expect(new LLMError("x", null, true)).toBeInstanceOf(Error);
    expect(parseJsonContent('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });
});
