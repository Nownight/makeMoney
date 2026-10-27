/**
 * Live check of the ScrapeGraphAI search adapter + filter (no database).
 *
 *   pnpm --filter @research/web try-search "AI 编程工具"
 *
 * Reads SGAI_API_KEY from apps/web/.env.local. Costs ~2 credits per result.
 */
import { createScrapeGraphClient, filterSources } from "@research/scrapegraph";

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
const response = await client.search({ query, numResults: Math.min(sourceLimit * 2, 20) });
const sources = filterSources(response.results, query, sourceLimit);

console.log(`Query: ${query}`);
console.log(`Raw results: ${response.results.length}, kept: ${sources.length}, ${Date.now() - startedAt}ms\n`);
for (const source of sources) {
  console.log(`#${source.searchRank} [${source.qualityScore}] ${source.title}`);
  console.log(`   ${source.url}`);
  console.log(`   ${source.snippet.slice(0, 120)}\n`);
}
