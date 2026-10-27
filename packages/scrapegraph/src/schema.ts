import { z } from "zod";

/**
 * Response of POST https://v2-api.scrapegraphai.com/api/search
 * Docs: https://docs.scrapegraphai.com/api-reference/endpoint/search
 * Only the fields we use are required; everything else is passed through.
 */
export const searchResultSchema = z.object({
  url: z.string(),
  title: z.string().nullish().transform((value) => value ?? ""),
  content: z.string().nullish().transform((value) => value ?? ""),
  provider: z.string().optional(),
  // Not documented for every provider; parsed if present.
  publishedAt: z.string().nullish(),
  date: z.string().nullish(),
});

export const searchResponseSchema = z.object({
  id: z.string().optional(),
  results: z.array(searchResultSchema),
  metadata: z
    .object({
      pages: z
        .object({ requested: z.number(), scraped: z.number() })
        .optional(),
    })
    .passthrough()
    .optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;

/**
 * Response of POST https://v2-api.scrapegraphai.com/api/extract
 * Docs: https://docs.scrapegraphai.com/api-reference/endpoint/extract
 */
export const extractResponseSchema = z.object({
  id: z.string().optional(),
  json: z.unknown().nullable(),
  raw: z.string().nullish(),
});

export type ExtractResponse = z.infer<typeof extractResponseSchema>;
