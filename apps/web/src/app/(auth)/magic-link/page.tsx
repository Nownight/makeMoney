import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "邮箱登录链接",
  description: "使用一次性邮箱链接登录契机 AI，无需密码。",
};

export default async function MagicLinkPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthCard
      title="使用邮箱登录"
      description="输入邮箱，我们会发送一条一次性登录链接。无需记忆密码。"
      footer={
        <>
          已经有账号？
          <Link
            href="/login"
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            使用密码登录
          </Link>
        </>
      }
    >
      <MagicLinkForm />
    </AuthCard>
  );
}
