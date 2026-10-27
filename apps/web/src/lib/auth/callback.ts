import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/redirect";
import { logEvent } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && ALLOWED_TYPES.has(value as EmailOtpType);
}

/**
 * Handles both Supabase email link formats:
 *   * PKCE code flow used by the default email templates (`?code=...`).
 *   * Token-hash flow used when templates are customised (`?token_hash=...`).
 */
export async function handleAuthCallback(request: NextRequest): Promise<never> {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logEvent("warn", "auth.callback.code_exchange_failed", {
        code: error.code ?? "unknown",
        status: error.status ?? null,
      });
      redirect("/login?error=expired_link");
    }

    redirect(next);
  }

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      logEvent("warn", "auth.callback.verify_otp_failed", {
        code: error.code ?? "unknown",
        status: error.status ?? null,
      });
      redirect("/login?error=expired_link");
    }

    redirect(next);
  }

  redirect("/login?error=invalid_link");
}
