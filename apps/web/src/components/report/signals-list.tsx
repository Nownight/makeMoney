"use client";

import { useState } from "react";

import { SourceBadge } from "@/components/report/section";
import type { OpportunityRow } from "@/lib/reports/opportunities";
import type { TypeShare } from "@/lib/reports/report-view";
import { cn } from "@/lib/utils";

function SignalItem({ row }: { row: OpportunityRow }) {
  return (
    <li className="grid gap-1.5 py-4 sm:grid-cols-[6.5rem_1fr] sm:gap-6">
      <span className="font-mono text-xs text-ink-soft tabular-nums sm:pt-0.5">{row.eventDate ?? "日期未知"}</span>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.title}</span>
          <span className="rounded-full border border-rule px-2 py-0.5 text-[11px] text-ink-soft">{row.typeLabel}</span>
        </div>
        {row.summary ? <p className="text-sm leading-relaxed text-ink-soft">{row.summary}</p> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          <span>门槛 {row.barrier}</span>
          <span>竞争 {row.competition}</span>
          {row.sourceUrl ? <SourceBadge url={row.sourceUrl} domain={row.sourceDomain ?? row.sourceUrl} /> : null}
        </div>
      </div>
    </li>
  );
}

/** Signals filterable by type; undated ones are collapsed at the end. */
export function SignalsList({ rows, shares }: { rows: OpportunityRow[]; shares: TypeShare[] }) {
  const [type, setType] = useState<string>("all");
  const visible = type === "all" ? rows : rows.filter((row) => row.type === type);
  // rows arrive dated-newest-first then undated (splitByDate on the server).
  const dated = visible.filter((row) => row.eventDate);
  const undated = visible.filter((row) => !row.eventDate);

  const chip = (value: string, label: string, count: number) => (
    <button
      key={value}
      type="button"
      onClick={() => setType(value)}
      aria-pressed={type === value}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        type === value
          ? "border-foreground bg-foreground text-background"
          : "border-rule text-ink-soft hover:border-amber hover:text-foreground",
      )}
    >
      {label} <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {chip("all", "全部", rows.length)}
        {shares.map((share) => chip(share.type, share.label, share.count))}
      </div>
      {dated.length > 0 ? (
        <ol className="divide-y divide-rule">
          {dated.map((row) => (
            <SignalItem key={row.id} row={row} />
          ))}
        </ol>
      ) : null}
      {undated.length > 0 ? (
        <details className="group rounded-xl border border-rule px-4 py-3" open={dated.length === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-ink-soft select-none">
            <span>未标注日期的信号 · {undated.length} 条</span>
            <span className="transition-transform group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <ol className="mt-2 divide-y divide-rule">
            {undated.map((row) => (
              <SignalItem key={row.id} row={row} />
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
