/**
 * Live check of the ScrapeGraphAI extract adapter + normalization (no database).
 *
 *   pnpm try-extract https://cursor.com/pricing
 *
 * Reads SGAI_API_KEY from apps/web/.env.local. Costs 5 credits per attempt
 * (up to 3 attempts when the output fails schema validation).
 */
import { createScrapeGraphClient, extractProducts, normalizeUrl } from "@research/scrapegraph";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // Fall back to the current environment (e.g. $env:SGAI_API_KEY).
}

const url = normalizeUrl(process.argv[2] ?? "");
const apiKey = process.env.SGAI_API_KEY;

if (!url) {
  console.error("Usage: pnpm try-extract <http(s) url>");
  process.exit(1);
}
if (!apiKey) {
  console.error("SGAI_API_KEY is missing in apps/web/.env.local");
  process.exit(1);
}

const startedAt = Date.now();
const result = await extractProducts(createScrapeGraphClient({ apiKey }), url);

console.log(`URL: ${url}`);
console.log(`Status: ${result.status}, attempts: ${result.attempts}, ${Date.now() - startedAt}ms\n`);
console.log(JSON.stringify(result.status === "extracted" ? result.products : result.reason, null, 2));
