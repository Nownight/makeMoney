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
import {
  parseSearchQueries,
  sourceStatusBadge,
  supportingSources,
  toOpportunityRows,
} from "@/lib/reports/opportunities";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "契机报告",
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
    .select("id, query, title, status, progress, source_limit, error_message, executive_summary, analysis_json, search_queries, created_at")
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

  const opportunities = toOpportunityRows(items ?? [], sources ?? []);
  const searchQueries = parseSearchQueries(report.search_queries);
  const sourceCount = sources?.length ?? 0;
  const extractedCount = sources?.filter((s) => s.status === "extracted").length ?? 0;
  const progress = clampProgress(report.progress);
  const parsedAnalysis = reportAnalysisSchema.safeParse(report.analysis_json);
  const analysis = parsedAnalysis.success ? parsedAnalysis.data : null;

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
              <p>{report.error_message ?? "生成失败，请稍后重试"}</p>
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

          {searchQueries.length > 0 ? (
            <div className="space-y-2 text-sm">
              <span className="text-muted-foreground">检索关键词</span>
              <div className="flex flex-wrap gap-2">
                {searchQueries.map((query) => (
                  <Badge key={query} variant="outline" className="font-normal">
                    {query}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {analysis ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>契机摘要</CardTitle>
              <Badge variant="secondary">AI 生成</Badge>
            </div>
            <CardDescription>基于提取的信号自动生成，评分为 AI 主观判断，请结合来源核实。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <p className="leading-relaxed">{report.executive_summary ?? analysis.executiveSummary}</p>

            <section className="grid gap-4 md:grid-cols-2">
              {analysis.topOpportunities.map((opportunity, index) => (
                <div key={`${opportunity.name}-${index}`} className="space-y-3 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{opportunity.name}</h3>
                    <Badge variant="outline">AI 分析</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <ScoreBadge label="时效性" value={opportunity.scores.timeliness} />
                    <ScoreBadge label="证据" value={opportunity.scores.evidence} />
                    <ScoreBadge label="可行性" value={opportunity.scores.feasibility} />
                  </div>
                  <OpportunityField label="为什么是现在" text={opportunity.whyNow} />
                  <OpportunityField label="适合谁" text={opportunity.whoFits} />
                  <OpportunityField label="如何起步" text={opportunity.howToStart} />
                  <AnalysisList title="风险" items={opportunity.risks} />
                  <SourceLinks links={supportingSources(opportunity.itemIds, opportunities)} />
                </div>
              ))}
            </section>

            <AnalysisList title="趋势" items={analysis.trends} />
            <AnalysisList title="注意事项" items={analysis.warnings} />
          </CardContent>
        </Card>
      ) : null}

      {opportunities.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>机会信号</CardTitle>
            <CardDescription>
              共提取 {opportunities.length} 条机会信号，成功分析 {extractedCount} / {sourceCount} 个来源。
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4 font-medium">机会</th>
                  <th className="py-2 pr-4 font-medium">类型</th>
                  <th className="py-2 pr-4 font-medium">日期</th>
                  <th className="py-2 pr-4 font-medium">门槛</th>
                  <th className="py-2 pr-4 font-medium">竞争</th>
                  <th className="py-2 font-medium">来源</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {opportunities.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-4 font-medium">{row.title}</td>
                    <td className="py-2 pr-4">{row.typeLabel}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{row.eventDate ?? "未知"}</td>
                    <td className="py-2 pr-4">{row.barrier}</td>
                    <td className="py-2 pr-4">{row.competition}</td>
                    <td className="py-2">
                      {row.sourceUrl ? (
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          {row.sourceDomain}
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

function ScoreBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md bg-muted px-2 py-0.5">
      {label} <span className="font-medium">{value}</span>/5
    </span>
  );
}

function OpportunityField({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <p className="leading-relaxed">
      <span className="text-muted-foreground">{label}：</span>
      {text}
    </p>
  );
}

function SourceLinks({ links }: { links: Array<{ url: string; domain: string }> }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">支撑来源</span>
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:underline"
        >
          {link.domain}
          <ExternalLink className="size-3 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}
