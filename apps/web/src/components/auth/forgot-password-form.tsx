"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { FieldError } from "@/components/auth/field-error";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordAction,
  type AuthFormState,
} from "@/lib/auth/actions";

const initialState: AuthFormState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">注册邮箱</Label>
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

      <FormMessage state={state} />

      <SubmitButton
        className="h-10 w-full"
        pendingLabel="正在发送…"
        size="lg"
      >
        发送重置链接
        <ArrowRight />
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        想起来密码了？
        <Link
          href="/login"
          className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          返回登录
        </Link>
      </p>
    </form>
  );
}
