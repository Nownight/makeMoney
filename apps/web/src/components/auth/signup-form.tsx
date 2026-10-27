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
  signUpAction,
  type AuthFormState,
} from "@/lib/auth/actions";

const initialState: AuthFormState = { status: "idle" };

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          没有收到邮件？请检查垃圾邮件目录，或稍后重新提交注册。验证完成后即可登录。
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          前往登录
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="displayName">
          昵称 <span className="font-normal text-muted-foreground">（可选）</span>
        </Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          placeholder="怎么称呼你"
          className="h-10"
          maxLength={50}
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
        />
        <FieldError messages={state.fieldErrors?.displayName} />
      </div>

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
        <Label htmlFor="password">密码</Label>
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
        <Label htmlFor="confirmPassword">确认密码</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="再次输入密码"
          className="h-10"
          required
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
        <FieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      <FormMessage state={state} />

      <SubmitButton
        className="h-10 w-full"
        pendingLabel="正在创建账号…"
        size="lg"
      >
        创建账号
        <ArrowRight />
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        注册即表示你同意我们仅为提供服务而处理你的账号与研究数据。
      </p>
    </form>
  );
}
