import { ArrowLeft, CircleAlert } from "lucide-react";
import { reportAnalysisSchema } from "@research/llm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AutoRefresh } from "@/components/report/auto-refresh";
import { OpportunityScatter, SignalTimeline, TypeDistribution } from "@/components/report/charts";
import { OpportunityCard } from "@/components/report/opportunity-card";
import { Panel, ReportSection } from "@/components/report/section";
import { SignalsList } from "@/components/report/signals-list";
import { SourcesList } from "@/components/report/sources-list";
import { getCurrentUser } from "@/lib/auth/session";
import {
  clampProgress,
  reportStatusLabel,
  reportStatusMessage,
} from "@/lib/reports/status";
import {
  parseSearchQueries,
  supportingSources,
  toOpportunityRows,
} from "@/lib/reports/opportunities";
import {
  isRunning,
  opportunityScatter,
  signalTimeline,
  splitByDate,
  typeDistribution,
} from "@/lib/reports/report-view";
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

  const rows = toOpportunityRows(items ?? [], sources ?? []);
  const { dated, undated } = splitByDate(rows);
  const shares = typeDistribution(rows);
  const searchQueries = parseSearchQueries(report.search_queries);
  const sourceCount = sources?.length ?? 0;
  const extractedCount = sources?.filter((s) => s.status === "extracted").length ?? 0;
  const progress = clampProgress(report.progress);
  const parsedAnalysis = reportAnalysisSchema.safeParse(report.analysis_json);
  const analysis = parsedAnalysis.success ? parsedAnalysis.data : null;
  const running = isRunning(report.status);
  const summary = report.executive_summary ?? analysis?.executiveSummary ?? null;
  const statusMessage = reportStatusMessage({
    status: report.status,
    progress,
    extractedCount,
    sourceCount,
  });

  const stats = [
    { label: "契机", value: analysis ? String(analysis.topOpportunities.length) : "—" },
    { label: "信号", value: String(rows.length) },
    { label: "来源", value: sourceCount > 0 ? `${extractedCount}/${sourceCount}` : "—" },
  ];

  return (
    <div className="report-paper -mx-5 -my-8 px-5 py-10 sm:-mx-8 sm:-my-10 sm:px-8 sm:py-14">
      {running ? <AutoRefresh /> : null}
      <div className="mx-auto max-w-5xl space-y-16 sm:space-y-24">
        {/* Hero */}
        <header className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-700">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            返回控制台
          </Link>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
              <span className="font-medium tracking-[0.18em] text-amber-ink uppercase">契机报告</span>
              <span aria-hidden>·</span>
              <span
                className={
                  report.status === "failed"
                    ? "rounded-full bg-destructive/10 px-2.5 py-0.5 text-destructive"
                    : "rounded-full border border-rule px-2.5 py-0.5"
                }
              >
                {reportStatusLabel(report.status)}
              </span>
              <span>{dateTimeFormatter.format(new Date(report.created_at))}</span>
            </div>
            <h1 className="max-w-4xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-6xl">
              {report.query}
            </h1>
            {report.title && report.title !== report.query ? (
              <p className="text-lg text-ink-soft">{report.title}</p>
            ) : null}
            {summary ? (
              <p className="max-w-3xl text-lg leading-relaxed text-pretty sm:text-xl">{summary}</p>
            ) : null}
          </div>

          <dl className="grid grid-cols-3 divide-x divide-rule border-y border-rule">
            {stats.map((stat) => (
              <div key={stat.label} className="px-2 py-5 first:pl-0 sm:px-6 sm:first:pl-0">
                <dt className="text-xs text-ink-soft">{stat.label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{stat.value}</dd>
              </div>
            ))}
          </dl>

          {searchQueries.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-ink-soft">检索关键词</span>
              {searchQueries.map((query) => (
                <span key={query} className="rounded-full border border-rule px-2.5 py-0.5 text-ink-soft">
                  {query}
                </span>
              ))}
            </div>
          ) : null}

          {report.status === "failed" ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <p>{report.error_message ?? "生成失败，请稍后重试"}</p>
            </div>
          ) : running ? (
            <RunningState progress={progress} message={statusMessage} />
          ) : (
            <p className="text-sm text-ink-soft">{statusMessage}</p>
          )}
        </header>

        {analysis ? (
          <ReportSection
            eyebrow="AI 分析"
            title="值得关注的契机"
            note="基于提取的信号自动生成，评分（1-5）为 AI 主观判断，请结合来源核实。"
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
              <div className="space-y-6">
                {analysis.topOpportunities.map((opportunity, index) => (
                  <OpportunityCard
                    key={`${opportunity.name}-${index}`}
                    index={index + 1}
                    opportunity={opportunity}
                    sources={supportingSources(opportunity.itemIds, rows)}
                  />
                ))}
              </div>
              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <Panel>
                  <h3 className="mb-3 text-sm font-medium">时效性 × 可行性</h3>
                  <OpportunityScatter points={opportunityScatter(analysis.topOpportunities)} />
                </Panel>
              </aside>
            </div>

            {analysis.trends.length > 0 || analysis.warnings.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                <TextList title="趋势" items={analysis.trends} />
                <TextList title="注意事项" items={analysis.warnings} muted />
              </div>
            ) : null}
          </ReportSection>
        ) : running ? (
          <SkeletonCards />
        ) : null}

        {rows.length > 0 ? (
          <ReportSection
            eyebrow="信号"
            title="机会信号"
            note={`共提取 ${rows.length} 条机会信号，成功分析 ${extractedCount} / ${sourceCount} 个来源。`}
          >
            <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
              <Panel>
                <h3 className="mb-4 text-sm font-medium">信号时间线</h3>
                <SignalTimeline points={signalTimeline(rows)} undated={undated.length} />
              </Panel>
              <Panel>
                <h3 className="mb-4 text-sm font-medium">信号类型分布</h3>
                <TypeDistribution shares={shares} />
              </Panel>
            </div>
            <Panel>
              <SignalsList rows={[...dated, ...undated]} shares={shares} />
            </Panel>
          </ReportSection>
        ) : null}

        {sources && sources.length > 0 ? (
          <ReportSection eyebrow="来源" title="数据来源" note={`共 ${sources.length} 个来源，按质量分排序。`}>
            <Panel className="py-2 sm:py-2">
              <SourcesList sources={sources} />
            </Panel>
          </ReportSection>
        ) : null}
      </div>
    </div>
  );
}

function RunningState({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-ink-soft">
          <span className="size-2 animate-pulse rounded-full bg-amber" aria-hidden />
          {message}
        </span>
        <span className="font-medium tabular-nums">{progress}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-1 overflow-hidden rounded-full bg-rule"
      >
        <div className="h-full rounded-full bg-amber transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-6" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse space-y-4 rounded-2xl border border-rule bg-paper-raised p-6">
          <div className="h-5 w-1/3 rounded bg-rule" />
          <div className="h-2 w-1/2 rounded bg-rule" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-16 rounded bg-rule" />
            <div className="h-16 rounded bg-rule" />
            <div className="h-16 rounded bg-rule" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TextList({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <Panel className={muted ? "bg-transparent" : undefined}>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <ul className="space-y-2 text-sm leading-relaxed">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-amber" aria-hidden />
            <span className={muted ? "text-ink-soft" : undefined}>{item}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
