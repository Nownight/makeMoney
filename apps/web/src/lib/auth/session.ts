import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

/**
 * Verifies the access token on every call (getClaims), rather than trusting
 * the session cookie. Use this for every server-side authorization decision.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const claims = data.claims;
  const metadata = claims.user_metadata;
  const displayName =
    metadata && typeof metadata.display_name === "string"
      ? metadata.display_name
      : null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    displayName,
  };
}
