"use client";

import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { FieldError } from "@/components/auth/field-error";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  magicLinkAction,
  type AuthFormState,
} from "@/lib/auth/actions";

const initialState: AuthFormState = { status: "idle" };

export function MagicLinkForm() {
  const [state, formAction] = useActionState(magicLinkAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
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

      <FormMessage state={state} />

      <SubmitButton
        className="h-10 w-full"
        pendingLabel="正在发送…"
        size="lg"
      >
        <Mail />
        发送登录链接
        <ArrowRight />
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        登录链接有效期为 1 小时，且只能使用一次。首次使用会自动创建账号。
      </p>

      <p className="text-center text-sm text-muted-foreground">
        想使用密码登录？
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
