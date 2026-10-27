"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { publicEnv } from "@/lib/config";
import { toAuthErrorMessage } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/redirect";
import {
  forgotPasswordSchema,
  loginSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/auth/validation";
import { logEvent, logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function validationError(error: z.ZodError): AuthFormState {
  return {
    status: "error",
    message: "请检查表单内容",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

function callbackUrl(next?: string): string {
  const base = `${publicEnv.appUrl}/auth/callback`;
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

export async function signInAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: readField(formData, "email"),
    password: readField(formData, "password"),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    logEvent("warn", "auth.signin.failed", {
      code: error.code ?? "unknown",
      status: error.status ?? null,
    });
    return { status: "error", message: toAuthErrorMessage(error) };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signUpAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: readField(formData, "email"),
    password: readField(formData, "password"),
    confirmPassword: readField(formData, "confirmPassword"),
    displayName: readField(formData, "displayName"),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl(),
      data: parsed.data.displayName
        ? { display_name: parsed.data.displayName }
        : undefined,
    },
  });

  if (error) {
    logEvent("warn", "auth.signup.failed", {
      code: error.code ?? "unknown",
      status: error.status ?? null,
    });
    return { status: "error", message: toAuthErrorMessage(error) };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    status: "success",
    message: "注册成功。我们已向你的邮箱发送验证链接，请查收并完成验证。",
  };
}

export async function magicLinkAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = magicLinkSchema.safeParse({
    email: readField(formData, "email"),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl("/dashboard"),
      shouldCreateUser: true,
    },
  });

  if (error) {
    logEvent("warn", "auth.magiclink.failed", {
      code: error.code ?? "unknown",
      status: error.status ?? null,
    });
    return { status: "error", message: toAuthErrorMessage(error) };
  }

  return {
    status: "success",
    message: "如果该邮箱可以登录，我们已发送一封登录邮件，请查收。",
  };
}

export async function forgotPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: readField(formData, "email"),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: callbackUrl("/reset-password"),
    },
  );

  if (error) {
    logEvent("warn", "auth.recovery.failed", {
      code: error.code ?? "unknown",
      status: error.status ?? null,
    });
  }

  // Always return the same message to avoid account enumeration.
  return {
    status: "success",
    message: "如果该邮箱已注册，我们已发送一封重置密码的邮件，请查收。",
  };
}

export async function resetPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: readField(formData, "password"),
    confirmPassword: readField(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    logError("auth.reset_password.failed", error);
    return { status: "error", message: toAuthErrorMessage(error) };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
