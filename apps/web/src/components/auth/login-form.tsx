"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { FieldError } from "@/components/auth/field-error";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  signInAction,
  type AuthFormState,
} from "@/lib/auth/actions";

const initialState: AuthFormState = { status: "idle" };

type LoginFormProps = {
  next: string;
  linkError?: string;
};

const LINK_ERRORS: Record<string, string> = {
  invalid_link: "登录链接无效，请重新发起登录。",
  expired_link: "登录链接已过期或已被使用，请重新发起登录。",
  auth_callback_failed: "登录失败，请重试。",
  reset_required: "请先通过重置密码邮件中的链接进入此页面。",
};

export function LoginForm({ next, linkError }: LoginFormProps) {
  const [state, formAction] = useActionState(signInAction, initialState);
  const externalError = linkError ? LINK_ERRORS[linkError] : undefined;

  return (
    <div className="space-y-5">
      {externalError ? (
        <FormMessage
          state={{ status: "error", message: externalError }}
        />
      ) : null}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />

        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-10"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          <FieldError messages={state.fieldErrors?.email} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">密码</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              忘记密码？
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="输入你的密码"
            className="h-10"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <FieldError messages={state.fieldErrors?.password} />
        </div>

        <FormMessage state={state} />

        <SubmitButton
          className="h-10 w-full"
          pendingLabel="正在登录…"
          size="lg"
        >
          登录
          <ArrowRight />
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">或</span>
        <Separator className="flex-1" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        不想记密码？
        <Link
          href="/magic-link"
          className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          使用邮箱登录链接
        </Link>
      </p>
    </div>
  );
}
