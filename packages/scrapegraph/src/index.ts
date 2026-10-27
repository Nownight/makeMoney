export {
  createScrapeGraphClient,
  ScrapeGraphError,
  SGAI_BASE_URL,
  type ScrapeGraphClient,
  type ExtractParams,
  type ScrapeGraphClientOptions,
  type SearchParams,
} from "./client";
export {
  domainOf,
  filterSources,
  isJunkUrl,
  normalizeUrl,
  recencyBonus,
  scoreSource,
  toSnippet,
  type FilteredSource,
} from "./filter";
export {
  extractResponseSchema,
  searchResponseSchema,
  searchResultSchema,
  type ExtractResponse,
  type SearchResponse,
  type SearchResult,
} from "./schema";
export {
  extractOpportunities,
  type ExtractOpportunitiesResult,
  type ExtractOptions,
} from "./extract-opportunities";
export { domainKeywords, isRelevantOpportunity } from "./relevance";
export {
  normalizeBillingPeriod,
  normalizeCurrency,
  normalizeDate,
  normalizedOpportunitySchema,
  normalizeOpportunity,
  normalizePrice,
  normalizeStringList,
  type NormalizedOpportunity,
  type NormalizedPrice,
  type PricePeriod,
} from "./normalize";
export {
  buildExtractionPrompt,
  EXTRACTION_JSON_SCHEMA,
  EXTRACTION_PROMPT,
  extractionResultSchema,
  levelSchema,
  OPPORTUNITY_TYPE_LABELS,
  OPPORTUNITY_TYPES,
  opportunitySchema,
  SCHEMA_VERSION,
  STRICT_EXTRACTION_PROMPT,
  type ExtractionResult,
  type Level,
  type Opportunity,
  type OpportunityType,
} from "./opportunity";
export { hasBlockedMarkers, looksBlocked, MIN_CONTENT_LENGTH } from "./blocked";
