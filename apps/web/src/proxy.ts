import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { decideRouteAccess } from "@/lib/auth/routes";
import { publicEnv } from "@/lib/config";
import { logError } from "@/lib/logger";
import type { Database } from "@/lib/supabase/database.types";

const CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

function copySessionState(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));

  for (const header of CACHE_HEADERS) {
    const value = from.headers.get(header);
    if (value) {
      to.headers.set(header, value);
    }
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  let isAuthenticated = false;

  try {
    const { data, error } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(!error && data?.claims?.sub);
  } catch (error) {
    logError("proxy.get_claims.failed", error);
  }

  const { pathname, search } = request.nextUrl;
  const access = decideRouteAccess(pathname, isAuthenticated);

  if (access.type === "redirect") {
    const url = new URL(access.to, request.url);

    if (access.reason === "auth_required") {
      url.searchParams.set("next", `${pathname}${search}`);
    }

    const redirectResponse = NextResponse.redirect(url);
    copySessionState(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next.js internals and static image assets.
     * Auth must stay in the matcher so refresh tokens are rotated reliably.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
