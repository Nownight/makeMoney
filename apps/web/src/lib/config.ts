import { z } from "zod";

const httpUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return (
          (url.protocol === "http:" || url.protocol === "https:") &&
          Boolean(url.hostname)
        );
      } catch {
        return false;
      }
    },
    { error: "must be a valid http(s) URL" },
  );

const supabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: httpUrlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .trim()
    .min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short"),
  NEXT_PUBLIC_APP_URL: httpUrlSchema,
});

export type ParsePublicEnvOptions = {
  /**
   * Local development can fall back to http://localhost:3000. Production must
   * set the value explicitly, otherwise auth emails would point at localhost.
   */
  allowMissingAppUrl?: boolean;
};

export type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
};

type PublicEnvInput = Record<string, string | undefined>;

/**
 * Validates the public Supabase configuration. Kept pure so tests can exercise
 * it without touching process.env.
 */
export function parsePublicEnv(
  input: PublicEnvInput,
  options: ParsePublicEnvOptions = {},
): PublicEnv {
  const allowMissingAppUrl =
    options.allowMissingAppUrl ?? process.env.NODE_ENV !== "production";

  const result = (allowMissingAppUrl
    ? supabaseSchema.extend({
        NEXT_PUBLIC_APP_URL: httpUrlSchema.default("http://localhost:3000"),
      })
    : supabaseSchema
  ).safeParse({
    NEXT_PUBLIC_SUPABASE_URL: input.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: input.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: input.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Invalid public environment configuration. Copy .env.example to apps/web/.env.local and fill it in. ${details}`,
    );
  }

  return {
    supabaseUrl: result.data.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, ""),
    supabaseAnonKey: result.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: result.data.NEXT_PUBLIC_APP_URL.replace(/\/+$/, ""),
  };
}

// Next.js inlines direct NEXT_PUBLIC_* property reads into the client bundle.
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
