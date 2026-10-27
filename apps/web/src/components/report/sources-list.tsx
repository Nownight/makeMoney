import { sourceStatusBadge } from "@/lib/reports/opportunities";
import { cn } from "@/lib/utils";

type SourceRow = {
  id: string;
  url: string;
  title: string | null;
  domain: string;
  snippet: string | null;
  quality_score: number | null;
  status: string;
};

export function SourcesList({ sources }: { sources: SourceRow[] }) {
  return (
    <ol className="divide-y divide-rule">
      {sources.map((source, i) => {
        const badge = sourceStatusBadge(source.status);
        return (
          <li key={source.id} className="grid gap-2 py-4 sm:grid-cols-[2rem_1fr_auto] sm:items-baseline sm:gap-4">
            <span className="hidden font-mono text-xs text-ink-soft tabular-nums sm:block">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0 space-y-1">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-1 font-medium underline-offset-4 hover:underline"
              >
                {source.title ?? source.domain}
              </a>
              <p className="text-xs text-ink-soft">
                {source.domain}
                {source.quality_score !== null ? ` · 质量分 ${source.quality_score}` : ""}
              </p>
              {source.snippet ? <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">{source.snippet}</p> : null}
            </div>
            <span
              className={cn(
                "w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                badge.variant === "destructive" && "bg-destructive/10 text-destructive",
                badge.variant === "default" && "bg-amber-soft text-amber-ink",
                (badge.variant === "secondary" || badge.variant === "outline") && "border border-rule text-ink-soft",
              )}
            >
              {badge.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
