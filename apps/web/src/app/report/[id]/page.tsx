import { ArrowLeft, CircleAlert, Clock, ExternalLink } from "lucide-react";
import { reportAnalysisSchema } from "@research/llm";
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
  reportStatusMessage,
  reportStatusVariant,
} from "@/lib/reports/status";
import { sourceStatusBadge, toProductRows } from "@/lib/reports/products";
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
    .select("id, query, title, status, progress, source_limit, error_message, executive_summary, analysis_json, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!report) {
    notFound();
  }

  const { data: sources } = await supabase
    .from("sources")
    .select("id, url, title, domain, snippet, search_rank, quality_score, status")
    .eq("report_id", report.id)
    .order("quality_score", { ascending: false, nullsFirst: false })
    .order("search_rank", { ascending: true });

  const { data: items } = await supabase
    .from("extracted_items")
    .select("id, source_id, normalized_data")
    .eq("report_id", report.id)
    .order("created_at", { ascending: true });

  const products = toProductRows(items ?? [], sources ?? []);
  const sourceCount = sources?.length ?? 0;
  const extractedCount = sources?.filter((s) => s.status === "extracted").length ?? 0;
  const progress = clampProgress(report.progress);
  const parsedAnalysis = reportAnalysisSchema.safeParse(report.analysis_json);
  const analysis = parsedAnalysis.success ? parsedAnalysis.data : null;
  const productNames = new Map(products.map((product) => [product.id, product.name]));

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
            <CardTitle className="text-xl">{report.title ?? report.query}</CardTitle>
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
              {reportStatusMessage({
                status: report.status,
                progress,
                extractedCount,
                sourceCount,
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {analysis ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>分析摘要</CardTitle>
              <Badge variant="secondary">AI 生成</Badge>
            </div>
            <CardDescription>基于提取的数据自动生成，请结合来源核实。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <p className="leading-relaxed">{report.executive_summary ?? analysis.executiveSummary}</p>

            <AnalysisList title="关键发现" items={analysis.keyFindings} />

            {analysis.rankings.length > 0 ? (
              <section className="space-y-3">
                <h3 className="font-medium">排名</h3>
                {analysis.rankings.map((ranking, index) => (
                  <div key={`${ranking.title}-${index}`} className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{ranking.title}</span>
                      <span className="text-xs text-muted-foreground">（{ranking.metric}）</span>
                      {ranking.isSubjective ? <Badge variant="outline">AI 分析</Badge> : null}
                    </div>
                    <ol className="list-decimal space-y-0.5 pl-5 text-muted-foreground">
                      {ranking.items.map((item) => (
                        <li key={item.itemId}>
                          {productNames.get(item.itemId) ?? "未知条目"}：{item.value}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </section>
            ) : null}

            <AnalysisList title="结论" items={analysis.conclusions} />
            <AnalysisList title="注意事项" items={analysis.warnings} />
          </CardContent>
        </Card>
      ) : null}

      {products.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>产品概览</CardTitle>
            <CardDescription>
              共提取 {products.length} 个产品，成功分析 {extractedCount} / {sourceCount} 个来源。
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4 font-medium">产品</th>
                  <th className="py-2 pr-4 font-medium">公司</th>
                  <th className="py-2 pr-4 font-medium">最低价格</th>
                  <th className="py-2 pr-4 font-medium">免费版</th>
                  <th className="py-2 pr-4 font-medium">功能数</th>
                  <th className="py-2 font-medium">来源</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="py-2 pr-4 font-medium">{product.name}</td>
                    <td className="py-2 pr-4">{product.company ?? "—"}</td>
                    <td className="py-2 pr-4">{product.cheapest}</td>
                    <td className="py-2 pr-4">
                      {product.freePlan === null ? "未知" : product.freePlan ? "有" : "无"}
                    </td>
                    <td className="py-2 pr-4">{product.featureCount}</td>
                    <td className="py-2">
                      {product.sourceUrl ? (
                        <a
                          href={product.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          {product.sourceDomain}
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

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
                    <Badge variant={sourceStatusBadge(source.status).variant}>
                      {sourceStatusBadge(source.status).label}
                    </Badge>
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

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="font-medium">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
