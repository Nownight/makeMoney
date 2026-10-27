import { describe, expect, it } from "vitest";

import { decideRouteAccess, isProtectedPath } from "@/lib/auth/routes";

describe("decideRouteAccess", () => {
  it("redirects guests away from protected areas", () => {
    for (const pathname of [
      "/dashboard",
      "/dashboard/settings",
      "/report/abc",
      "/admin",
      "/reset-password",
    ]) {
      expect(decideRouteAccess(pathname, false)).toEqual({
        type: "redirect",
        to: "/login",
        reason: "auth_required",
      });
    }
  });

  it("does not protect paths that merely share a prefix", () => {
    expect(isProtectedPath("/dashboardx")).toBe(false);
    expect(decideRouteAccess("/dashboardx", false)).toEqual({
      type: "allow",
    });
  });

  it("allows guests to browse public pages", () => {
    for (const pathname of ["/", "/login", "/signup", "/magic-link"]) {
      expect(decideRouteAccess(pathname, false)).toEqual({ type: "allow" });
    }
  });

  it("redirects signed-in users away from auth entry pages", () => {
    for (const pathname of ["/login", "/signup", "/magic-link"]) {
      expect(decideRouteAccess(pathname, true)).toEqual({
        type: "redirect",
        to: "/dashboard",
        reason: "already_signed_in",
      });
    }
  });

  it("allows signed-in users into protected areas", () => {
    for (const pathname of [
      "/dashboard",
      "/report/abc",
      "/admin",
      "/reset-password",
    ]) {
      expect(decideRouteAccess(pathname, true)).toEqual({ type: "allow" });
    }
  });
});
