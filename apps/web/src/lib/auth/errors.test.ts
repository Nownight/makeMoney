import { describe, expect, it } from "vitest";

import { toAuthErrorMessage } from "@/lib/auth/errors";

describe("toAuthErrorMessage", () => {
  it("maps invalid credentials without leaking which field was wrong", () => {
    expect(
      toAuthErrorMessage({ message: "Invalid login credentials" }),
    ).toBe("邮箱或密码不正确");
  });

  it("maps unconfirmed email", () => {
    expect(toAuthErrorMessage({ message: "Email not confirmed" })).toBe(
      "邮箱尚未验证，请先查收验证邮件",
    );
  });

  it("maps rate limits", () => {
    expect(
      toAuthErrorMessage({
        message: "For security purposes, you can only request this once every 60 seconds",
      }),
    ).toBe("操作过于频繁，请稍后再试");
  });

  it("falls back to a generic message", () => {
    expect(toAuthErrorMessage({ message: "Unexpected upstream error" })).toBe(
      "操作失败，请稍后重试",
    );
    expect(toAuthErrorMessage(null)).toBe("操作失败，请稍后重试");
  });
});
