import type { TopOpportunity } from "@research/llm";

import { Panel, SourceBadge } from "@/components/report/section";
import { overallScore } from "@/lib/reports/report-view";

function ScoreRing({ value }: { value: number }) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative grid size-16 shrink-0 place-items-center" aria-label={`综合评分 ${value}/5`}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx={28} cy={28} r={r} fill="none" strokeWidth={4} className="stroke-rule" />
        <circle
          cx={28}
          cy={28}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          className="stroke-amber"
          strokeDasharray={`${(value / 5) * circumference} ${circumference}`}
        />
      </svg>
      <span className="text-sm font-semibold tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr_1.5rem] items-center gap-3 text-xs">
      <span className="text-ink-soft">{label}</span>
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((step) => (
          <span key={step} className={step <= value ? "h-1.5 flex-1 rounded-full bg-amber" : "h-1.5 flex-1 rounded-full bg-rule"} />
        ))}
      </div>
      <span className="text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Column({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium tracking-wide text-ink-soft">{label}</h4>
      <p className="text-sm leading-relaxed">{text || "—"}</p>
    </div>
  );
}

export function OpportunityCard({
  index,
  opportunity,
  sources,
}: {
  index: number;
  opportunity: TopOpportunity;
  sources: Array<{ url: string; domain: string }>;
}) {
  const { scores } = opportunity;
  return (
    <Panel className="space-y-6 transition-shadow hover:shadow-[0_8px_30px_rgb(0_0_0/0.05)]">
      <div className="flex items-start gap-4">
        <span className="pt-1 font-mono text-sm text-amber-ink tabular-nums">{String(index).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{opportunity.name}</h3>
            <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-medium text-amber-ink">AI 分析</span>
          </div>
        </div>
        <ScoreRing value={overallScore(scores)} />
      </div>

      <div className="grid gap-2 sm:max-w-md">
        <ScoreBar label="时效性" value={scores.timeliness} />
        <ScoreBar label="证据" value={scores.evidence} />
        <ScoreBar label="可行性" value={scores.feasibility} />
      </div>

      <div className="grid gap-5 border-t border-rule pt-5 md:grid-cols-3 md:gap-8">
        <Column label="为什么是现在" text={opportunity.whyNow} />
        <Column label="适合谁" text={opportunity.whoFits} />
        <Column label="如何起步" text={opportunity.howToStart} />
      </div>

      {opportunity.risks.length > 0 ? (
        <details className="group rounded-xl border border-rule px-4 py-3 text-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-ink-soft select-none">
            <span>风险 · {opportunity.risks.length} 条</span>
            <span className="transition-transform group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed">
            {opportunity.risks.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {sources.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-soft">支撑来源</span>
          {sources.map((link) => (
            <SourceBadge key={link.url} url={link.url} domain={link.domain} />
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
