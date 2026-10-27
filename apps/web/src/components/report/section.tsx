import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Editorial section: small eyebrow, large heading, optional note. */
export function ReportSection({
  eyebrow,
  title,
  note,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-700", className)}>
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-amber-ink uppercase">{eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {note ? <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">{note}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-rule bg-paper-raised p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] sm:p-6", className)}>
      {children}
    </div>
  );
}

export function SourceBadge({ url, domain }: { url: string; domain: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-rule px-2.5 py-0.5 text-xs text-ink-soft transition-colors hover:border-amber hover:text-foreground"
    >
      {domain}
      <span aria-hidden>↗</span>
    </a>
  );
}
