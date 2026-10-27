import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "登录",
  description: "登录研图 AI，查看和管理你的研究报告。",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <AuthCard
      title="欢迎回来"
      description="登录后继续你的研究，查看历史报告与下载记录。"
      footer={
        <>
          还没有账号？
          <Link
            href="/signup"
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            免费注册
          </Link>
        </>
      }
    >
      <LoginForm next={next} linkError={params.error} />
    </AuthCard>
  );
}
