/**
 * Live check of the LLM provider with EXAMPLE data (no database, no scraping).
 *
 *   pnpm try-analyze
 *
 * Reads OPENAI_API_KEY, ANALYSIS_MODEL and optional LLM_BASE_URL from
 * apps/web/.env.local (or the current environment).
 */
import { DEFAULT_LLM_BASE_URL, OpenAICompatibleProvider } from "@research/llm";
import { exampleItems } from "@research/llm/example-items";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // Fall back to the current environment (e.g. $env:OPENAI_API_KEY).
}

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.ANALYSIS_MODEL;
const baseUrl = process.env.LLM_BASE_URL || DEFAULT_LLM_BASE_URL;

if (!apiKey || !model) {
  console.error("OPENAI_API_KEY and ANALYSIS_MODEL are required (apps/web/.env.local)");
  process.exit(1);
}

console.log(`Base URL: ${baseUrl}\nModel: ${model}\nItems: ${exampleItems.length} (example data)\n`);
const startedAt = Date.now();
const result = await new OpenAICompatibleProvider({ apiKey, model, baseUrl }).analyze({
  query: "AI 编程工具",
  items: exampleItems,
});

console.log(
  `OK in ${Date.now() - startedAt}ms, attempts: ${result.attempts}, dropped ids: ${result.droppedIds}, usage: ${JSON.stringify(result.usage)}\n`,
);
console.log(JSON.stringify(result.analysis, null, 2));
