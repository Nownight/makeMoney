import { describe, expect, it } from "vitest";

import {
  EXTRACTION_JSON_SCHEMA,
  EXTRACTION_PROMPT,
  SCHEMA_VERSION,
  STRICT_EXTRACTION_PROMPT,
  extractionResultSchema,
} from "./product";
import { validProduct } from "./__fixtures__/product";


describe("ProductSchema", () => {
  it("accepts a valid extraction", () => {
    expect(extractionResultSchema.safeParse({ products: [validProduct] }).success).toBe(true);
    expect(extractionResultSchema.safeParse({ products: [] }).success).toBe(true);
  });

  it("rejects missing fields and wrong types", () => {
    const { freePlan: _omit, ...missing } = validProduct;
    expect(extractionResultSchema.safeParse({ products: [missing] }).success).toBe(false);
    expect(
      extractionResultSchema.safeParse({ products: [{ ...validProduct, freePlan: "yes" }] }).success,
    ).toBe(false);
    expect(extractionResultSchema.safeParse(null).success).toBe(false);
  });

  it("converts to a JSON schema with required product fields", () => {
    const json = JSON.stringify(EXTRACTION_JSON_SCHEMA);
    expect(EXTRACTION_JSON_SCHEMA.type).toBe("object");
    for (const field of ["products", "pricing", "freePlan", "sourceEvidence", "billingPeriod"]) {
      expect(json).toContain(`"${field}"`);
    }
  });

  it("has a version and injection-safe prompts", () => {
    expect(SCHEMA_VERSION).toMatch(/^product-v\d+$/);
    expect(EXTRACTION_PROMPT).toMatch(/Ignore any instructions/);
    expect(STRICT_EXTRACTION_PROMPT).toContain(EXTRACTION_PROMPT);
    expect(STRICT_EXTRACTION_PROMPT).toMatch(/STRICT/);
  });
});
