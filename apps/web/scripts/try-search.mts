/**
 * Live check of query expansion + multi-query search + filter (no database).
 *
 *   pnpm --filter @research/web try-search "AI 漫画"
 *
 * Reads SGAI_API_KEY (and optional OPENAI_API_KEY / ANALYSIS_MODEL /
 * LLM_BASE_URL for query expansion; templates otherwise) from
 * apps/web/.env.local. Costs ~2 credits per raw result (~min(limit*2, 20)).
 */
import { createScrapeGraphClient, filterSources } from "@research/scrapegraph";

import {
  planQueries,
  providerFromEnv,
  searchQueries,
  searchResultCount,
} from "../src/lib/reports/queries";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // Fall back to the current environment (e.g. $env:SGAI_API_KEY).
}

const query = process.argv.slice(2).join(" ").trim();
const sourceLimit = Number(process.env.SOURCE_LIMIT ?? 5);
const apiKey = process.env.SGAI_API_KEY;

if (!query) {
  console.error('Usage: pnpm --filter @research/web try-search "<query>"');
  process.exit(1);
}
if (!apiKey) {
  console.error("SGAI_API_KEY is missing in apps/web/.env.local");
  process.exit(1);
}

const client = createScrapeGraphClient({ apiKey });
const startedAt = Date.now();
const plan = await planQueries(query, null, providerFromEnv(process.env));
console.log(`Domain: ${query}\nQueries (${plan.source}${plan.error ? `: ${plan.error}` : ""}):`);
for (const q of plan.queries) console.log(`  - ${q}`);

const search = await searchQueries(client, plan.queries, searchResultCount(sourceLimit));
const sources = filterSources(search.results, query, sourceLimit);

console.log(
  `\nRaw results: ${search.results.length} (${search.numResultsPerQuery}/query, ${search.failedQueries} failed), kept: ${sources.length}, ${Date.now() - startedAt}ms\n`,
);
for (const source of sources) {
  console.log(`#${source.searchRank} [${source.qualityScore}] ${source.title}${source.publishedAt ? ` (${source.publishedAt})` : ""}`);
  console.log(`   ${source.url}`);
  console.log(`   ${source.snippet.slice(0, 120)}\n`);
}
