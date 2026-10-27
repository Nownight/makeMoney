import { describe, expect, it, vi } from "vitest";

import { ScrapeGraphError, type ScrapeGraphClient } from "./client";
import { extractProducts } from "./extract-products";
import { STRICT_EXTRACTION_PROMPT } from "./product";
import { validProduct } from "./__fixtures__/product";

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

describe("extractProducts", () => {
  it("returns normalized products on first valid output", async () => {
    const { client, extract } = clientWith({ products: [validProduct] });
    const result = await extractProducts(client, "https://a.com");
    expect(result).toMatchObject({ status: "extracted", attempts: 1 });
    if (result.status === "extracted") expect(result.products[0].pricing[0].amount).toBe(20);
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it("retries invalid output, using the strict prompt last", async () => {
    const { client, extract } = clientWith({ bad: 1 }, null, { products: [validProduct] });
    const result = await extractProducts(client, "https://a.com");
    expect(result).toMatchObject({ status: "extracted", attempts: 3 });
    expect(extract.mock.calls[2][0].prompt).toBe(STRICT_EXTRACTION_PROMPT);
  });

  it("marks partial after three invalid outputs", async () => {
    const { client } = clientWith({}, {}, { products: [{ name: "" }] });
    expect(await extractProducts(client, "https://a.com")).toMatchObject({ status: "partial", attempts: 3 });
  });

  it("marks failed on API errors", async () => {
    const { client } = clientWith({}, new ScrapeGraphError("HTTP 500", 500, true));
    expect(await extractProducts(client, "https://a.com")).toMatchObject({
      status: "failed",
      attempts: 2,
      reason: "HTTP 500",
    });
  });
});
