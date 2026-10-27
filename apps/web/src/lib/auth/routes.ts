const PROTECTED_PREFIXES = [
  "/dashboard",
  "/report",
  "/admin",
  "/reset-password",
] as const;

const AUTH_ENTRY_PREFIXES = ["/login", "/signup", "/magic-link"] as const;

export type RouteAccess =
  | { type: "allow" }
  | { type: "redirect"; to: string; reason: "auth_required" | "already_signed_in" };

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isAuthEntryPath(pathname: string): boolean {
  return AUTH_ENTRY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

/**
 * Central route policy used by the proxy. Keeping it pure makes the redirect
 * matrix testable without booting Next.js or Supabase.
 */
export function decideRouteAccess(
  pathname: string,
  isAuthenticated: boolean,
): RouteAccess {
  if (!isAuthenticated && isProtectedPath(pathname)) {
    return { type: "redirect", to: "/login", reason: "auth_required" };
  }

  if (isAuthenticated && isAuthEntryPath(pathname)) {
    return { type: "redirect", to: "/dashboard", reason: "already_signed_in" };
  }

  return { type: "allow" };
}
