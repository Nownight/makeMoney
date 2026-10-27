import type { ScatterPoint, TimelinePoint, TypeShare } from "@/lib/reports/report-view";

const SCALE = [1, 2, 3, 4, 5];

/** Timeliness × feasibility, bubble size = evidence (all 1-5, AI judgment). */
export function OpportunityScatter({ points }: { points: ScatterPoint[] }) {
  const width = 360;
  const height = 280;
  const pad = { left: 40, right: 16, top: 16, bottom: 40 };
  const x = (v: number) => pad.left + ((v - 1) / 4) * (width - pad.left - pad.right);
  const y = (v: number) => height - pad.bottom - ((v - 1) / 4) * (height - pad.top - pad.bottom);

  return (
    <figure className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="时效性与可行性分布">
        <rect x={x(3)} y={y(5)} width={x(5) - x(3)} height={y(3) - y(5)} className="fill-amber-soft" opacity={0.5} rx={6} />
        <text x={x(5) - 6} y={y(5) + 14} textAnchor="end" className="fill-amber-ink text-[10px]">优先关注</text>
        {SCALE.map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={y(1)} y2={y(5)} className="stroke-rule" strokeDasharray="2 4" />
            <line x1={x(1)} x2={x(5)} y1={y(v)} y2={y(v)} className="stroke-rule" strokeDasharray="2 4" />
            <text x={x(v)} y={height - pad.bottom + 16} textAnchor="middle" className="fill-ink-soft text-[10px]">{v}</text>
            <text x={pad.left - 10} y={y(v) + 3} textAnchor="end" className="fill-ink-soft text-[10px]">{v}</text>
          </g>
        ))}
        <text x={(x(1) + x(5)) / 2} y={height - 6} textAnchor="middle" className="fill-ink-soft text-[11px]">时效性 →</text>
        <text x={12} y={(y(1) + y(5)) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(y(1) + y(5)) / 2})`} className="fill-ink-soft text-[11px]">可行性 →</text>
        {points.map((point) => (
          <g key={point.index}>
            <title>{`${point.index}. ${point.name}（证据 ${point.size}/5）`}</title>
            <circle cx={x(point.x)} cy={y(point.y)} r={6 + point.size * 3} className="fill-amber stroke-paper-raised" fillOpacity={0.55} strokeWidth={2} />
            <text x={x(point.x)} y={y(point.y) + 4} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">{point.index}</text>
          </g>
        ))}
      </svg>
      <figcaption className="text-xs text-ink-soft">气泡越大，证据越充分。编号对应下方契机卡片。</figcaption>
    </figure>
  );
}

/** Dated signals per day. */
export function SignalTimeline({ points, undated }: { points: TimelinePoint[]; undated: number }) {
  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-soft">暂无带日期的信号{undated > 0 ? `（${undated} 条未标注日期）` : ""}。</p>;
  }
  const max = Math.max(...points.map((p) => p.count));
  const height = 160;
  const barWidth = 18;
  const gap = 10;
  const width = Math.max(280, points.length * (barWidth + gap) + 20);
  const labelEvery = Math.ceil(points.length / 8);

  return (
    <figure className="space-y-3">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-auto w-full min-w-[280px]" role="img" aria-label="信号时间线">
          <line x1={0} x2={width} y1={height} y2={height} className="stroke-rule" />
          {points.map((point, i) => {
            const h = Math.max(4, (point.count / max) * (height - 20));
            const left = 10 + i * (barWidth + gap);
            return (
              <g key={point.date}>
                <title>{`${point.date}：${point.count} 条`}</title>
                <rect x={left} y={height - h} width={barWidth} height={h} rx={4} className="fill-amber" fillOpacity={0.75} />
                {i % labelEvery === 0 || i === points.length - 1 ? (
                  <text x={left + barWidth / 2} y={height + 16} textAnchor="middle" className="fill-ink-soft text-[10px]">
                    {point.date.slice(5)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="text-xs text-ink-soft">
        {points[0].date} — {points[points.length - 1].date}
        {undated > 0 ? ` · 另有 ${undated} 条未标注日期` : ""}
      </figcaption>
    </figure>
  );
}

export function TypeDistribution({ shares }: { shares: TypeShare[] }) {
  return (
    <ul className="space-y-3">
      {shares.map((share, i) => (
        <li key={share.type} className="space-y-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span>{share.label}</span>
            <span className="tabular-nums text-ink-soft">
              {share.count} · {Math.round(share.share * 100)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-rule">
            <div
              className={i === 0 ? "h-full rounded-full bg-amber" : "h-full rounded-full bg-foreground/35"}
              style={{ width: `${Math.max(4, share.share * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
