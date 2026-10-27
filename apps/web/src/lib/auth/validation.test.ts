import { describe, expect, it } from "vitest";

import {
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/auth/validation";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("邮箱格式不正确");
    }
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    email: "user@example.com",
    password: "secret123",
    confirmPassword: "secret123",
    displayName: "  Ada  ",
  };

  it("accepts a valid registration", () => {
    const result = signUpSchema.safeParse(valid);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Ada");
    }
  });

  it("rejects passwords without a number", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      password: "onlyletters",
      confirmPassword: "onlyletters",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("密码需包含数字");
    }
  });

  it("rejects passwords without a letter", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      password: "12345678",
      confirmPassword: "12345678",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched password confirmation", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      confirmPassword: "different1",
    });

    expect(result.success).toBe(false);
  });

  it("turns an empty display name into undefined", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      displayName: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBeUndefined();
    }
  });
});

describe("resetPasswordSchema", () => {
  it("rejects a short password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "a1",
      confirmPassword: "a1",
    });

    expect(result.success).toBe(false);
  });
});
