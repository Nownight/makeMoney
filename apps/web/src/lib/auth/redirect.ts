const FALLBACK_PATH = "/dashboard";

const MAX_LENGTH = 2048;

/**
 * Prevents open redirects. Only same-origin, absolute paths are allowed.
 * `next` usually comes from a query string or a hidden form field, so it must
 * always be treated as untrusted input.
 */
export function safeNextPath(
  value: unknown,
  fallback: string = FALLBACK_PATH,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const raw = value.trim();

  if (!raw || raw.length > MAX_LENGTH) {
    return fallback;
  }

  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }

  // Backslashes and control characters are normalised differently by browsers
  // and proxies; reject them instead of trying to sanitise them.
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) {
    return fallback;
  }

  // Do not accept `/javascript:...` or similar scheme-looking paths.
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(raw)) {
    return fallback;
  }

  try {
    const parsed = new URL(raw, "https://app.invalid");
    const result = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (!result.startsWith("/") || result.startsWith("//")) {
      return fallback;
    }

    return result;
  } catch {
    return fallback;
  }
}
