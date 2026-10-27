import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/auth/redirect";

describe("safeNextPath", () => {
  it.each([
    "/dashboard",
    "/dashboard?q=ai",
    "/report/abc-123#charts",
    "/",
    "/dashboard?next=%2Freport%2F1",
  ])("allows same-origin path %s", (value) => {
    expect(safeNextPath(value)).toBe(value);
  });

  it.each([
    "https://evil.example",
    "http://evil.example/path",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "/javascript:alert(1)",
    "data:text/html,hello",
    "dashboard",
    "",
    "   ",
    "/dashboard\nSet-Cookie: x=1",
    "/dashboard\r\nLocation: https://evil.example",
  ])("rejects unsafe value %s", (value) => {
    expect(safeNextPath(value)).toBe("/dashboard");
  });

  it("falls back for non-string values", () => {
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(42)).toBe("/dashboard");
  });

  it("uses a custom fallback", () => {
    expect(safeNextPath("https://evil.example", "/login")).toBe("/login");
  });

  it("trims surrounding whitespace", () => {
    expect(safeNextPath("  /report/1  ")).toBe("/report/1");
  });

  it("rejects very long values", () => {
    expect(safeNextPath(`/${"a".repeat(3000)}`)).toBe("/dashboard");
  });
});
