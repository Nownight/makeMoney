import type { SearchResult } from "./schema";

export type FilteredSource = {
  url: string;
  title: string;
  domain: string;
  snippet: string;
  searchRank: number;
  qualityScore: number;
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
 * Turns raw search results into at most `limit` sources: drops invalid/junk
 * URLs and duplicates, keeps max 2 per domain, sorts by quality score.
 */
export function filterSources(
  results: readonly SearchResult[],
  query: string,
  limit: number,
): FilteredSource[] {
  const seen = new Set<string>();
  const candidates: FilteredSource[] = [];

  results.forEach((result, index) => {
    const url = normalizeUrl(result.url);
    if (!url || seen.has(url) || isJunkUrl(url)) return;
    seen.add(url);

    const searchRank = index + 1;
    candidates.push({
      url,
      title: result.title.trim() || domainOf(url),
      domain: domainOf(url),
      snippet: toSnippet(result.content),
      searchRank,
      qualityScore: scoreSource(url, searchRank, query),
    });
  });

  candidates.sort(
    (a, b) => b.qualityScore - a.qualityScore || a.searchRank - b.searchRank,
  );

  const perDomain = new Map<string, number>();
  const selected: FilteredSource[] = [];

  for (const candidate of candidates) {
    const count = perDomain.get(candidate.domain) ?? 0;
    if (count >= MAX_PER_DOMAIN) continue;
    perDomain.set(candidate.domain, count + 1);
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected;
}
