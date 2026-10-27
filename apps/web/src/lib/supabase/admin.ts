import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/config";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Service-role client that bypasses RLS. Server-only: use it only for writes
 * the browser must never make (report status, sources). Returns null when
 * SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return createClient<Database>(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
