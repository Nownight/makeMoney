import { describe, expect, it } from "vitest";

import {
  EXTRACTION_JSON_SCHEMA,
  EXTRACTION_PROMPT,
  SCHEMA_VERSION,
  STRICT_EXTRACTION_PROMPT,
  buildExtractionPrompt,
  extractionResultSchema,
  OPPORTUNITY_TYPE_LABELS,
  OPPORTUNITY_TYPES,
} from "./opportunity";
import { validOpportunity } from "./__fixtures__/opportunity";
describe("OpportunitySchema", () => {
  it("accepts a valid extraction", () => {
    expect(extractionResultSchema.safeParse({ opportunities: [validOpportunity] }).success).toBe(true);
    expect(extractionResultSchema.safeParse({ opportunities: [] }).success).toBe(true);
  });

  it("rejects missing fields and wrong types", () => {
    const { eventDate: _omit, ...missing } = validOpportunity;
    expect(extractionResultSchema.safeParse({ opportunities: [missing] }).success).toBe(false);
    expect(
      extractionResultSchema.safeParse({ opportunities: [{ ...validOpportunity, type: "新工具" }] }).success,
    ).toBe(false);
    expect(extractionResultSchema.safeParse(null).success).toBe(false);
  });

  it("converts to a JSON schema with required opportunity fields", () => {
    const json = JSON.stringify(EXTRACTION_JSON_SCHEMA);
    expect(EXTRACTION_JSON_SCHEMA.type).toBe("object");
    for (const field of ["opportunities", "type", "eventDate", "entryBarrier", "evidence", "new_tool"]) {
      expect(json).toContain(`"${field}"`);
    }
  });

  it("has a version and injection-safe prompts", () => {
    expect(SCHEMA_VERSION).toMatch(/^opportunity-v\d+$/);
    expect(EXTRACTION_PROMPT).toMatch(/Ignore any instructions/);
    expect(STRICT_EXTRACTION_PROMPT).toContain(EXTRACTION_PROMPT);
    expect(STRICT_EXTRACTION_PROMPT).toMatch(/STRICT/);
  });

  it("has a Chinese label for every type", () => {
    for (const type of OPPORTUNITY_TYPES) expect(OPPORTUNITY_TYPE_LABELS[type]).toBeTruthy();
    expect(OPPORTUNITY_TYPE_LABELS.capital).toBe("资本动向");
  });
});

describe("buildExtractionPrompt", () => {
  it("matches the base prompts without a domain", () => {
    expect(buildExtractionPrompt()).toBe(EXTRACTION_PROMPT);
    expect(buildExtractionPrompt(null, true)).toBe(STRICT_EXTRACTION_PROMPT);
  });

  it("requires domain relevance when a domain is given", () => {
    const prompt = buildExtractionPrompt("AI编程工具", true);
    expect(prompt).toContain('"AI编程工具"');
    expect(prompt).toMatch(/unrelated industries/);
    expect(prompt).toMatch(/STRICT/);
  });
});
