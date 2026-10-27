import type { NormalizedOpportunity } from "./normalize";

/** Bigrams / words too generic to prove a signal belongs to the domain. */
const GENERIC_TOKENS = new Set([
  "ai", "app", "the", "and", "for", "saas",
  "工具", "平台", "行业", "市场", "服务", "产品", "公司", "技术", "系统", "应用",
  "智能", "人工", "工智", "软件", "领域", "方向", "机会", "商业", "创业",
]);

/**
 * Cheap, LLM-free domain keywords: latin words (>= 2 chars) and CJK bigrams,
 * minus generic ones. "AI编程工具" -> ["编程", "程工"].
 */
export function domainKeywords(domain: string): string[] {
  const text = domain.toLowerCase();
  const tokens = new Set<string>();
  for (const word of text.match(/[a-z0-9][a-z0-9+#.-]*/g) ?? []) {
    if (word.length >= 2) tokens.add(word);
  }
  for (const run of text.match(/[\u3400-\u9fff]+/g) ?? []) {
    if (run.length === 1) tokens.add(run);
    for (let i = 0; i + 1 < run.length; i += 1) tokens.add(run.slice(i, i + 2));
  }
  return [...tokens].filter((token) => !GENERIC_TOKENS.has(token));
}

/**
 * Post-extraction safety net: keeps a signal when any domain keyword appears
 * in its text. When the domain has no specific keyword, everything is kept
 * (the extraction prompt is the primary relevance filter).
 */
export function isRelevantOpportunity(opportunity: NormalizedOpportunity, domain: string): boolean {
  const keywords = domainKeywords(domain);
  if (keywords.length === 0) return true;
  const haystack = [
    opportunity.title,
    opportunity.summary,
    ...opportunity.signals,
    ...opportunity.targetAudience,
    ...opportunity.monetization,
    ...opportunity.evidence.map((item) => item.text),
  ]
    .join(" ")
    .toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}
