import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "设置新密码",
  description: "为研图 AI 账号设置新密码。",
};

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?error=reset_required");
  }

  return (
    <AuthCard
      title="设置新密码"
      description={`正在为 ${user.email ?? "你的账号"} 设置新密码。保存后即可使用新密码登录。`}
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
