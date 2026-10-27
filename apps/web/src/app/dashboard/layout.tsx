import { LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const initial = (user.displayName ?? user.email ?? "U")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link
                href="/dashboard"
                className="rounded-md px-2.5 py-1.5 font-medium text-foreground"
              >
                控制台
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2.5 rounded-full border bg-background py-1 pr-3 pl-1 sm:flex">
              <span className="grid size-7 place-items-center rounded-full bg-foreground text-xs font-medium text-background">
                {initial}
              </span>
              <span className="max-w-44 truncate text-xs text-muted-foreground">
                {user.email ?? "已登录"}
              </span>
            </div>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 px-2.5 text-muted-foreground"
              >
                <LogOut />
                <span className="hidden sm:inline">退出</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
