import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-muted/20">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative z-10 flex h-16 items-center justify-between px-5 sm:px-8">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          返回首页
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:py-14">
        {children}
      </main>

      <footer className="relative z-10 px-5 pb-8 text-center text-xs text-muted-foreground">
        安全登录由 Supabase Auth 提供
      </footer>
    </div>
  );
}
