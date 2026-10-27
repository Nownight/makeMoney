import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleAuthCallback } from "@/lib/auth/callback";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/logger", () => ({
  logEvent: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
}));

type FakeAuthResult = {
  error: { code?: string; status?: number } | null;
};

function buildClient(result: FakeAuthResult) {
  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue(result),
      verifyOtp: vi.fn().mockResolvedValue(result),
    },
  };
}

function makeRequest(query: string): NextRequest {
  return {
    nextUrl: new URL(`http://localhost:3000/auth/callback${query}`),
  } as unknown as NextRequest;
}

async function captureRedirect(request: NextRequest): Promise<string> {
  try {
    await handleAuthCallback(request);
  } catch (error) {
    if (error && typeof error === "object" && "url" in error) {
      return String((error as { url: unknown }).url);
    }

    throw error;
  }

  throw new Error("handleAuthCallback did not redirect");
}

beforeEach(() => {
  createClientMock.mockReset();
});

describe("handleAuthCallback", () => {
  it("exchanges a PKCE code and redirects to a safe next path", async () => {
    const client = buildClient({ error: null });
    createClientMock.mockResolvedValue(client);

    const target = await captureRedirect(
      makeRequest("?code=abc123&next=%2Freport%2F1%3Ftab%3Dsummary"),
    );

    expect(target).toBe("/report/1?tab=summary");
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(client.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("drops an unsafe next path after a successful exchange", async () => {
    const client = buildClient({ error: null });
    createClientMock.mockResolvedValue(client);

    const target = await captureRedirect(
      makeRequest("?code=abc123&next=https%3A%2F%2Fevil.example"),
    );

    expect(target).toBe("/dashboard");
  });

  it("redirects to the login page when the code exchange fails", async () => {
    const client = buildClient({
      error: { code: "otp_expired", status: 403 },
    });
    createClientMock.mockResolvedValue(client);

    const target = await captureRedirect(makeRequest("?code=abc123"));

    expect(target).toBe("/login?error=expired_link");
  });

  it("verifies a token hash for a supported email type", async () => {
    const client = buildClient({ error: null });
    createClientMock.mockResolvedValue(client);

    const target = await captureRedirect(
      makeRequest("?token_hash=hash123&type=recovery&next=%2Freset-password"),
    );

    expect(target).toBe("/reset-password");
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "hash123",
    });
  });

  it("rejects a token hash with an unsupported type", async () => {
    const client = buildClient({ error: null });
    createClientMock.mockResolvedValue(client);

    const target = await captureRedirect(
      makeRequest("?token_hash=hash123&type=not-a-real-type"),
    );

    expect(target).toBe("/login?error=invalid_link");
    expect(client.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("redirects to the login page when the token hash is invalid", async () => {
    const client = buildClient({
      error: { code: "otp_expired", status: 403 },
    });
    createClientMock.mockResolvedValue(client);

    const target = await captureRedirect(
      makeRequest("?token_hash=hash123&type=signup"),
    );

    expect(target).toBe("/login?error=expired_link");
  });

  it("rejects a callback without code or token hash", async () => {
    const client = buildClient({ error: null });
    createClientMock.mockResolvedValue(client);

    const target = await captureRedirect(makeRequest(""));

    expect(target).toBe("/login?error=invalid_link");
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(client.auth.verifyOtp).not.toHaveBeenCalled();
  });
});
