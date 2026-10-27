import { looksBlocked } from "./blocked";
import { normalizeDate } from "./normalize";
import type { SearchResult } from "./schema";

export type FilteredSource = {
  url: string;
  title: string;
  domain: string;
  snippet: string;
  searchRank: number;
  qualityScore: number;
  /** YYYY-MM-DD from the search result, or null. */
  publishedAt: string | null;
};

const MAX_PER_DOMAIN = 2;
const SNIPPET_LENGTH = 300;

const SEARCH_ENGINE_HOSTS = [
  "google.",
  "bing.com",
  "baidu.com",
  "duckduckgo.com",
  "sogou.com",
  "so.com",
  "search.yahoo.com",
  "yandex.",
];

const SOCIAL_HOSTS = [
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "tiktok.com",
  "pinterest.com",
  "douyin.com",
];

const AUTH_PATH = /\/(login|log-in|signin|sign-in|signup|sign-up|register|auth|account)(\/|$|\.)/i;
const SEARCH_PATH = /\/(search|s)(\/|$)/i;
const BINARY_EXTENSION = /\.(png|jpe?g|gif|webp|svg|zip|rar|exe|dmg|mp4|mp3)$/i;

/**
 * Canonical form used for dedupe and storage: http(s) only, no hash, no
 * utm_* params, lowercase host, no trailing slash. Returns null if invalid.
 */
export function normalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_")) {
      url.searchParams.delete(key);
    }
  }

  const path = url.pathname.replace(/\/+$/, "");
  const search = url.searchParams.toString();
  return `${url.protocol}//${url.host.toLowerCase()}${path}${search ? `?${search}` : ""}`;
}

export function domainOf(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
}

function hostMatches(domain: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) =>
    pattern.endsWith(".")
      ? domain.startsWith(pattern) || domain.includes(`.${pattern}`)
      : domain === pattern || domain.endsWith(`.${pattern}`),
  );
}

/** Search-engine result pages, login/signup pages and binary files. */
export function isJunkUrl(url: string): boolean {
  const parsed = new URL(url);
  const domain = domainOf(url);

  if (hostMatches(domain, SEARCH_ENGINE_HOSTS) && (SEARCH_PATH.test(parsed.pathname) || parsed.searchParams.has("q") || parsed.searchParams.has("wd"))) {
    return true;
  }

  return AUTH_PATH.test(parsed.pathname) || BINARY_EXTENSION.test(parsed.pathname);
}

function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

/**
 * Small, explainable heuristic (0..100):
 *   50 base
 *   +25 domain contains a query keyword (likely the official site)
 *   +10 docs./developer. subdomain or .gov/.edu/.org
 *   +5  https
 *   -20 social network
 *   +0..10 earlier search rank
 */
export function scoreSource(url: string, rank: number, query: string): number {
  const domain = domainOf(url);
  let score = 50;

  if (queryTokens(query).some((token) => domain.includes(token))) score += 25;
  if (/^(docs|developer|developers)\./.test(domain) || /\.(gov|edu|org)(\.[a-z]{2})?$/.test(domain)) score += 10;
  if (url.startsWith("https://")) score += 5;
  if (hostMatches(domain, SOCIAL_HOSTS)) score -= 20;
  score += Math.max(0, 10 - (rank - 1) * 2);

  return Math.min(100, Math.max(0, score));
}

const FRESH_URL = /\/\/([^/]*\.)?news\.|\/news\/|\/blog\/|36kr\.com|producthunt\.com|techcrunch\.com|github\.com\/trending/i;
const FRESH_TITLE = /发布|融资|榜单|最新|launch|funding|raises|2026/i;
const STALE_URL = /baike\.|wiki|zhidao\./i;
const STALE_TITLE = /什么是|如何|what is|how to/i;

/** Small heuristic: favor news/launch/funding/list pages, penalize encyclopedia/how-to. */
export function recencyBonus(url: string, title: string): number {
  let bonus = 0;
  if (FRESH_URL.test(url)) bonus += 10;
  if (FRESH_TITLE.test(title)) bonus += 10;
  if (STALE_URL.test(url)) bonus -= 20;
  if (STALE_TITLE.test(title)) bonus -= 10;
  return bonus;
}

const LIST_URL = /\/(t|tag|tags|topic|topics|category|categories|list|lists|archive|archives)(\/|$)|financingbulletin|\/list[_-]|[?&]page=/i;
const LIST_TITLE = /快报|快讯|汇总|合集|一览|列表|日报|周报|早报|晚报|融资动态|tag|archive/i;

/** Aggregator/list pages mix unrelated topics; push them below article pages. */
export function listPagePenalty(url: string, title: string): number {
  let penalty = 0;
  if (LIST_URL.test(new URL(url).pathname + new URL(url).search)) penalty -= 25;
  if (LIST_TITLE.test(title)) penalty -= 15;
  return penalty;
}

const SECOND_LEVEL = /^(com|net|org|gov|edu|co|ac)$/;

/** Registrable-ish site key so m.example.com and news.example.com share a cap. */
export function siteKey(domain: string): string {
  const labels = domain.split(".");
  if (labels.length <= 2) return domain;
  const keep = SECOND_LEVEL.test(labels[labels.length - 2]) && labels[labels.length - 1].length === 2 ? 3 : 2;
  return labels.slice(-keep).join(".");
}

export function toSnippet(content: string): string {
  const text = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}…` : text;
}

/**
 * Ranks raw search results: drops invalid/junk URLs, blocked pages and
 * duplicates, keeps max 2 per site, sorts by quality score. The tail beyond
 * the source limit is used as backfill when an extraction fails.
 */
export function rankSources(results: readonly SearchResult[], query: string): FilteredSource[] {
  const seen = new Set<string>();
  const candidates: FilteredSource[] = [];

  results.forEach((result, index) => {
    const url = normalizeUrl(result.url);
    if (!url || seen.has(url) || isJunkUrl(url) || looksBlocked(result.content)) return;
    seen.add(url);

    const searchRank = index + 1;
    const title = result.title.trim();
    const score =
      scoreSource(url, searchRank, query) + recencyBonus(url, title) + listPagePenalty(url, title);
    candidates.push({
      url,
      title: title || domainOf(url),
      domain: domainOf(url),
      snippet: toSnippet(result.content),
      searchRank,
      qualityScore: Math.min(100, Math.max(0, score)),
      publishedAt: normalizeDate(result.publishedAt ?? result.date),
    });
  });

  candidates.sort(
    (a, b) => b.qualityScore - a.qualityScore || a.searchRank - b.searchRank,
  );

  const perSite = new Map<string, number>();
  return candidates.filter((candidate) => {
    const key = siteKey(candidate.domain);
    const count = perSite.get(key) ?? 0;
    if (count >= MAX_PER_DOMAIN) return false;
    perSite.set(key, count + 1);
    return true;
  });
}

/** The top `limit` of rankSources. */
export function filterSources(
  results: readonly SearchResult[],
  query: string,
  limit: number,
): FilteredSource[] {
  return rankSources(results, query).slice(0, Math.max(0, limit));
}
