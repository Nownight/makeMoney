import { describe, expect, it, vi } from "vitest";

import { ScrapeGraphError, type ScrapeGraphClient } from "./client";
import { extractOpportunities } from "./extract-opportunities";
import { STRICT_EXTRACTION_PROMPT } from "./opportunity";
import { validOpportunity } from "./__fixtures__/opportunity";

function clientWith(...results: Array<unknown | Error>): {
  client: ScrapeGraphClient;
  extract: ReturnType<typeof vi.fn<ScrapeGraphClient["extract"]>>;
} {
  const extract = vi.fn<ScrapeGraphClient["extract"]>();
  for (const result of results) {
    if (result instanceof Error) extract.mockRejectedValueOnce(result);
    else extract.mockResolvedValueOnce({ json: result });
  }
  return { client: { search: vi.fn(), extract }, extract };
}

describe("extractOpportunities", () => {
  it("returns normalized opportunities on first valid output", async () => {
    const { client, extract } = clientWith({ opportunities: [validOpportunity] });
    const result = await extractOpportunities(client, "https://a.com");
    expect(result).toMatchObject({ status: "extracted", attempts: 1 });
    if (result.status === "extracted") expect(result.opportunities[0].eventDate).toBe("2026-03-05");
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it("retries invalid output, using the strict prompt last", async () => {
    const { client, extract } = clientWith({ bad: 1 }, null, { opportunities: [validOpportunity] });
    const result = await extractOpportunities(client, "https://a.com");
    expect(result).toMatchObject({ status: "extracted", attempts: 3 });
    expect(extract.mock.calls[2][0].prompt).toBe(STRICT_EXTRACTION_PROMPT);
  });

  it("marks partial after three invalid outputs", async () => {
    const { client } = clientWith({}, {}, { opportunities: [{ title: "" }] });
    expect(await extractOpportunities(client, "https://a.com")).toMatchObject({ status: "partial", attempts: 3 });
  });

  it("marks failed on API errors", async () => {
    const { client } = clientWith({}, new ScrapeGraphError("HTTP 500", 500, true));
    expect(await extractOpportunities(client, "https://a.com")).toMatchObject({
      status: "failed",
      attempts: 2,
      reason: "HTTP 500",
    });
  });
});

describe("extractOpportunities blocked pages", () => {
  it("fails without retrying when raw output shows a blocked page", async () => {
    const extract = vi.fn<ScrapeGraphClient["extract"]>().mockResolvedValue({
      json: { opportunities: [] },
      raw: '{"error":{"message":"您当前请求存在异常，暂时限制本次访问","code":40362}}',
    });
    const result = await extractOpportunities({ search: vi.fn(), extract }, "https://zhihu.com/q");
    expect(result).toMatchObject({ status: "failed", attempts: 1 });
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it("fails when the returned json itself is an error object", async () => {
    const extract = vi.fn<ScrapeGraphClient["extract"]>().mockResolvedValue({
      json: { error: { message: "Access Denied", code: 403 } },
    });
    expect(await extractOpportunities({ search: vi.fn(), extract }, "https://a.com")).toMatchObject({
      status: "failed",
    });
  });

  it("keeps real opportunities even if raw mentions captcha", async () => {
    const { client } = clientWith({ opportunities: [validOpportunity] });
    expect((await extractOpportunities(client, "https://a.com")).status).toBe("extracted");
  });

  it("scopes the prompt to the domain and drops irrelevant signals", async () => {
    const offTopic = { ...validOpportunity, title: "AI 医疗影像融资", summary: "医疗", signals: [], evidence: [], targetAudience: [], monetization: [] };
    const onTopic = { ...validOpportunity, title: "AI 编程助手发布" };
    const { client, extract } = clientWith({ opportunities: [offTopic, onTopic] });
    const result = await extractOpportunities(client, "https://a.com", { domain: "AI编程工具" });
    expect(extract.mock.calls[0][0].prompt).toContain('"AI编程工具"');
    expect(result).toMatchObject({ status: "extracted", irrelevant: 1 });
    if (result.status === "extracted") expect(result.opportunities.map((o) => o.title)).toEqual(["AI 编程助手发布"]);
  });

  it("fills month-day dates from the reference date", async () => {
    const { client } = clientWith({ opportunities: [{ ...validOpportunity, eventDate: "9月8日" }] });
    const result = await extractOpportunities(client, "https://a.com", { referenceDate: new Date("2026-10-27T00:00:00Z") });
    if (result.status === "extracted") expect(result.opportunities[0].eventDate).toBe("2026-09-08");
    expect(result.status).toBe("extracted");
  });
});
