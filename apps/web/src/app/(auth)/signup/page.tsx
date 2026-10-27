import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "注册",
  description: "创建契机 AI 账号，开始发现你关心领域的最新机会。",
};

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthCard
      title="创建账号"
      description="免费开始，输入你关心的领域，即可体验契机发现流程。"
      footer={
        <>
          已经有账号？
          <Link
            href="/login"
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            登录
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
