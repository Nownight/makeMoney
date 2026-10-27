/** Anti-bot / error page markers seen in fetched content (case-insensitive). */
const BLOCKED_MARKERS = [
  /captcha/i,
  /验证码/,
  /访问受限/,
  /限制本次访问/,
  /请求存在异常/,
  /access denied/i,
  /just a moment/i,
  /cf-challenge|cf_chl_/i,
  /enable javascript/i,
  /attention required/i,
];

/** A bare JSON error object such as {"error":{"message":"...","code":40362}}. */
const ERROR_JSON = /^\s*\{\s*"(error|code|errcode|errmsg)"\s*:/i;

export const MIN_CONTENT_LENGTH = 40;

/** True when text contains anti-bot / error-page markers (length-independent). */
export function hasBlockedMarkers(text: string): boolean {
  return ERROR_JSON.test(text) || BLOCKED_MARKERS.some((pattern) => pattern.test(text));
}

/**
 * Heuristic for search result content: blocked markers, or non-empty content
 * shorter than MIN_CONTENT_LENGTH. Empty content is not treated as blocked
 * (some providers omit it; extraction fetches the page itself).
 */
export function looksBlocked(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return trimmed.length < MIN_CONTENT_LENGTH || hasBlockedMarkers(trimmed);
}
