import { LogOut } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link className="transition-colors hover:text-foreground" href="/#features">
              产品能力
            </Link>
            <Link className="transition-colors hover:text-foreground" href="/#how-it-works">
              工作方式
            </Link>
            <Link className="transition-colors hover:text-foreground" href="/#example">
              示例报告
            </Link>
          </nav>
        </div>

        {user ? (
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="h-9 px-3">
              <Link href="/dashboard">控制台</Link>
            </Button>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                aria-label="退出登录"
                title="退出登录"
              >
                <LogOut />
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="h-9 px-3">
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild size="sm" className="h-9 px-3.5">
              <Link href="/signup">免费注册</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
