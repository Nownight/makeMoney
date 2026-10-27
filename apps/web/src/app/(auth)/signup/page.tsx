import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "注册",
  description: "创建研图 AI 账号，开始生成可下载的可视化研究报告。",
};

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthCard
      title="创建账号"
      description="免费开始，输入一个主题即可体验自动研究流程。"
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
