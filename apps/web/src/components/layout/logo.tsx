import { ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="研图 AI 首页"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background shadow-sm">
        <ChartNoAxesCombined className="size-4" strokeWidth={2.2} />
      </span>
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight">
          研图 <span className="font-normal text-muted-foreground">AI</span>
        </span>
      ) : null}
    </Link>
  );
}
