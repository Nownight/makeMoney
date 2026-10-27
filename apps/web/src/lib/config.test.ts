import { describe, expect, it } from "vitest";

import { parsePublicEnv } from "@/lib/config";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(40),
  NEXT_PUBLIC_APP_URL: "https://app.example.com",
};

describe("parsePublicEnv", () => {
  it("parses a valid configuration", () => {
    expect(parsePublicEnv(valid)).toEqual({
      supabaseUrl: "https://project.supabase.co",
      supabaseAnonKey: "a".repeat(40),
      appUrl: "https://app.example.com",
    });
  });

  it("strips trailing slashes", () => {
    const result = parsePublicEnv({
      ...valid,
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co/",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000///",
    });

    expect(result.supabaseUrl).toBe("https://project.supabase.co");
    expect(result.appUrl).toBe("http://localhost:3000");
  });

  it("defaults the app URL for local development", () => {
    const result = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: valid.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: valid.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    expect(result.appUrl).toBe("http://localhost:3000");
  });

  it("requires the app URL when the local fallback is disabled", () => {
    expect(() =>
      parsePublicEnv(
        {
          NEXT_PUBLIC_SUPABASE_URL: valid.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: valid.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        { allowMissingAppUrl: false },
      ),
    ).toThrow(/Invalid public environment/);
  });

  it("rejects missing values", () => {
    expect(() => parsePublicEnv({})).toThrow(/Invalid public environment/);
  });

  it("rejects a short anon key", () => {
    expect(() =>
      parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "short" }),
    ).toThrow(/Invalid public environment/);
  });

  it("rejects non-http URLs", () => {
    expect(() =>
      parsePublicEnv({
        ...valid,
        NEXT_PUBLIC_SUPABASE_URL: "ftp://project.supabase.co",
      }),
    ).toThrow(/Invalid public environment/);
  });
});
