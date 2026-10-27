"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";

import { FieldError } from "@/components/auth/field-error";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordAction,
  type AuthFormState,
} from "@/lib/auth/actions";

const initialState: AuthFormState = { status: "idle" };

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">新密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="至少 8 位，包含字母和数字"
          className="h-10"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">确认新密码</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="再次输入新密码"
          className="h-10"
          required
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
        <FieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      <FormMessage state={state} />

      <SubmitButton
        className="h-10 w-full"
        pendingLabel="正在更新…"
        size="lg"
      >
        更新密码
        <ArrowRight />
      </SubmitButton>
    </form>
  );
}
