import Link from "next/link";

import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            输入一个主题，自动完成搜索、数据提取、对比分析与可视化报告生成。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href="/login">
            登录
          </Link>
          <Link className="hover:text-foreground" href="/signup">
            注册
          </Link>
          <span className="text-xs">© {new Date().getFullYear()} 研图 AI</span>
        </div>
      </div>
    </footer>
  );
}
