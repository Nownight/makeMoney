import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "重置密码",
  description: "通过邮箱重置契机 AI 账号密码。",
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthCard
      title="重置密码"
      description="输入注册邮箱，我们会发送一封包含重置链接的邮件。"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
