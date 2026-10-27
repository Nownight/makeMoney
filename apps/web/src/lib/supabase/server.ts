import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv } from "@/lib/config";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Request-scoped Supabase client for Server Components, Server Actions and
 * Route Handlers. Never cache or share the returned client across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. The proxy refreshes the
            // session and writes the resulting cookies to the response.
          }
        },
      },
    },
  );
}
