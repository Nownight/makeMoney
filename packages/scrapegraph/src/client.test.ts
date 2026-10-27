import { describe, expect, it, vi } from "vitest";

import fixture from "./__fixtures__/search-response.json";
import { createScrapeGraphClient, ScrapeGraphError } from "./client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function setup(responses: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const item of responses) {
    if (item instanceof Error) fetchMock.mockRejectedValueOnce(item);
    else fetchMock.mockResolvedValueOnce(item);
  }
  const sleep = vi.fn(async (_ms: number) => {});
  const client = createScrapeGraphClient({ apiKey: "sgai-test", fetch: fetchMock, sleep });
  return { client, fetchMock, sleep };
}

describe("createScrapeGraphClient.search", () => {
  it("posts the documented request and validates the response", async () => {
    const { client, fetchMock } = setup([jsonResponse(fixture)]);

    const result = await client.search({ query: "AI 编程工具", numResults: 10 });

    expect(result.results).toHaveLength(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://v2-api.scrapegraphai.com/api/search");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("SGAI-APIKEY")).toBe("sgai-test");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      query: "AI 编程工具",
      numResults: 10,
    });
  });

  it("clamps numResults to the 1..20 API range", async () => {
    const { client, fetchMock } = setup([jsonResponse(fixture)]);
    await client.search({ query: "x", numResults: 40 });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).numResults).toBe(20);
  });

  it("retries twice with 2s and 5s backoff on 5xx/network errors", async () => {
    const { client, fetchMock, sleep } = setup([
      jsonResponse({}, 503),
      new TypeError("fetch failed"),
      jsonResponse(fixture),
    ]);

    await expect(client.search({ query: "x", numResults: 5 })).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([2000, 5000]);
  });

  it("gives up after 2 retries", async () => {
    const { client, fetchMock } = setup([
      jsonResponse({}, 500),
      jsonResponse({}, 502),
      jsonResponse({}, 429),
    ]);

    await expect(client.search({ query: "x", numResults: 5 })).rejects.toBeInstanceOf(ScrapeGraphError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry auth errors or invalid shapes", async () => {
    const auth = setup([jsonResponse({ detail: "bad key" }, 401)]);
    await expect(auth.client.search({ query: "x", numResults: 5 })).rejects.toMatchObject({ status: 401 });
    expect(auth.fetchMock).toHaveBeenCalledTimes(1);

    const shape = setup([jsonResponse({ nope: true })]);
    await expect(shape.client.search({ query: "x", numResults: 5 })).rejects.toThrow("unexpected response shape");
    expect(shape.fetchMock).toHaveBeenCalledTimes(1);
  });
});
