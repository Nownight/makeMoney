import { ArrowLeft, CircleAlert, Clock, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import {
  clampProgress,
  reportStatusLabel,
  reportStatusVariant,
} from "@/lib/reports/status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "研究报告",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/report/${encodeURIComponent(id)}`);
  }

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  // RLS hides other users' rows, so a foreign id behaves exactly like a missing one.
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("reports")
    .select("id, query, status, progress, source_limit, error_message, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!report) {
    notFound();
  }

  const { data: sources } = await supabase
    .from("sources")
    .select("id, url, title, domain, snippet, search_rank, quality_score")
    .eq("report_id", report.id)
    .order("quality_score", { ascending: false, nullsFirst: false })
    .order("search_rank", { ascending: true });

  const progress = clampProgress(report.progress);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        返回控制台
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-xl">{report.query}</CardTitle>
            <Badge variant={reportStatusVariant(report.status)}>
              {reportStatusLabel(report.status)}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            创建于 {dateTimeFormatter.format(new Date(report.created_at))} ·{" "}
            {report.source_limit} 个来源
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">进度</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {report.status === "failed" ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <p>{report.error_message ?? "研究失败，请稍后重试"}</p>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {sources && sources.length > 0
                ? "来源已就绪，等待下一阶段处理。数据提取、分析与可视化将在后续阶段接入。"
                : "报告已创建并进入队列。来源搜索完成后会在此页面展示。"}
            </p>
          )}
        </CardContent>
      </Card>

      {sources && sources.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>数据来源</CardTitle>
            <CardDescription>共 {sources.length} 个来源，按质量分排序。</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="divide-y rounded-lg border">
              {sources.map((source) => (
                <li key={source.id} className="space-y-1.5 px-4 py-3">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    {source.title ?? source.domain}
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                  </a>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{source.domain}</span>
                    {source.search_rank !== null ? (
                      <span>搜索排名 #{source.search_rank}</span>
                    ) : null}
                    {source.quality_score !== null ? (
                      <span>质量分 {source.quality_score}</span>
                    ) : null}
                  </div>
                  {source.snippet ? (
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {source.snippet}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
