import {
  FileText,
  Layers,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateReportForm } from "@/components/reports/create-report-form";
import { getCurrentUser } from "@/lib/auth/session";
import { reportStatusLabel, reportStatusVariant } from "@/lib/reports/status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "控制台",
  description: "管理你的研究报告、来源额度与账号信息。",
};

type DashboardPageProps = {
  searchParams: Promise<{ q?: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const RECENT_REPORTS_LIMIT = 20;

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card size="sm" className="gap-3 py-4">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ q }, supabase] = await Promise.all([searchParams, createClient()]);
  const [{ data: profile }, { data: reports }, { count: reportCount }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("reports")
        .select("id, query, status, created_at")
        .order("created_at", { ascending: false })
        .limit(RECENT_REPORTS_LIMIT),
      supabase.from("reports").select("id", { count: "exact", head: true }),
    ]);

  const query = q?.trim().slice(0, 120) ?? "";
  const plan = profile?.plan ?? "free";
  const credits = profile?.credits ?? 0;
  const sourceLimit = plan === "pro" ? 20 : 5;
  const displayName =
    profile?.display_name ?? user.displayName ?? user.email?.split("@")[0] ?? "研究者";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            你好，{displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            这里将汇总你的研究报告、数据来源和下载文件。
          </p>
        </div>
        <Badge variant="outline" className="w-fit px-2.5 py-1">
          <Sparkles className="size-3" />
          {plan === "pro" ? "Pro 计划" : "Free 计划"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>发起新研究</CardTitle>
          <CardDescription>
            输入产品、公司、工具或服务主题，创建一份研究报告。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateReportForm defaultQuery={query} maxSourceLimit={sourceLimit} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="可用额度"
          value={String(credits)}
          hint={plan === "pro" ? "每月自动重置" : "免费额度，用于发起研究"}
          icon={Wallet}
        />
        <StatCard
          label="报告数量"
          value={String(reportCount ?? 0)}
          hint="你创建的全部报告"
          icon={FileText}
        />
        <StatCard
          label="单次来源上限"
          value={String(sourceLimit)}
          hint={plan === "pro" ? "Pro 最多 20 个来源" : "Free 最多 5 个来源"}
          icon={Layers}
        />
        <StatCard
          label="当前计划"
          value={plan === "pro" ? "Pro" : "Free"}
          hint="按报告付费即将上线"
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="min-h-72">
          <CardHeader>
            <CardTitle>最近报告</CardTitle>
            <CardDescription>
              研究完成后，可在这里查看摘要、图表与可下载文件。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports && reports.length > 0 ? (
              <ul className="divide-y rounded-lg border">
                {reports.map((report) => (
                  <li key={report.id}>
                    <Link
                      href={`/report/${report.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {report.query}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dateTimeFormatter.format(new Date(report.created_at))}
                        </p>
                      </div>
                      <Badge variant={reportStatusVariant(report.status)}>
                        {reportStatusLabel(report.status)}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
                <span className="mb-4 grid size-11 place-items-center rounded-full bg-background ring-1 ring-border">
                  <FileText className="size-5 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium">还没有研究报告</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  在上方输入一个主题，即可创建你的第一份研究报告。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>账号信息</CardTitle>
            <CardDescription>登录身份与使用额度。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-foreground text-sm font-medium text-background">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email ?? "未绑定邮箱"}
                </p>
              </div>
            </div>

            <dl className="space-y-2.5 border-t pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">计划</dt>
                <dd className="font-medium">{plan === "pro" ? "Pro" : "Free"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">额度</dt>
                <dd className="font-medium">{credits} 次</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">注册时间</dt>
                <dd className="font-medium">
                  {profile?.created_at
                    ? dateFormatter.format(new Date(profile.created_at))
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
