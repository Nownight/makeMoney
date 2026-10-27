import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  FileSpreadsheet,
  Globe,
  Layers,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const EXAMPLES = ["AI 漫画", "宠物用品", "跨境电商", "短剧出海"];

const FEATURES = [
  {
    icon: Globe,
    title: "多角度实时检索",
    description:
      "自动把领域拆成新产品、融资、需求、变现、政策等多个检索角度，优先最新的新闻与发布。",
  },
  {
    icon: Layers,
    title: "结构化机会信号",
    description:
      "把网页统一成机会信号：类型、时间、热度信号、变现方式、进入门槛与证据原文。",
  },
  {
    icon: ChartNoAxesCombined,
    title: "AI 机会评估",
    description:
      "按时效性、证据强度、可行性给机会打分，并说明为什么是现在、适合谁、如何起步。",
  },
  {
    icon: ShieldCheck,
    title: "来源可追溯",
    description:
      "每个机会都引用支撑它的来源，过时的信息会被标注，方便核对而不是只给结论。",
  },
];

const STEPS = [
  {
    step: "01",
    title: "输入你关心的领域",
    description: "例如 AI 漫画、宠物用品、跨境电商，越具体越好。",
  },
  {
    step: "02",
    title: "搜索与筛选来源",
    description: "围绕多个角度检索最新内容，过滤重复、百科类与被拦截的页面。",
  },
  {
    step: "03",
    title: "提取机会信号",
    description: "按统一结构读取每个页面，标准化日期，保留证据原文。",
  },
  {
    step: "04",
    title: "评估并给出契机",
    description: "汇总最值得关注的契机、趋势与风险，每条都可追溯来源。",
  },
];

const PREVIEW_ROWS = [
  { name: "AI 条漫代制作", price: "新需求", free: "低", focus: "中小漫画工作室" },
  { name: "漫画出海本地化", price: "新渠道", free: "中", focus: "翻译 / 运营团队" },
  { name: "AI 漫剧短视频", price: "资本动向", free: "中", focus: "内容创作者" },
];

function SearchBox({ id }: { id: string }) {
  return (
    <form
      action="/dashboard"
      method="get"
      className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row"
      role="search"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor={id} className="sr-only">
          你关心的领域
        </label>
        <input
          id={id}
          name="q"
          type="search"
          required
          minLength={2}
          maxLength={120}
          autoComplete="off"
          placeholder="输入你关心的领域，例如：AI 漫画"
          className="h-12 w-full rounded-xl border border-border bg-background pr-4 pl-11 text-base shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 shrink-0 rounded-xl px-6 text-sm"
      >
        发现契机
        <ArrowRight />
      </Button>
    </form>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative mx-auto w-full max-w-5xl px-5 pt-20 pb-20 text-center sm:px-8 sm:pt-28 sm:pb-24">
            <Badge
              variant="outline"
              className="mb-6 h-auto gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs backdrop-blur"
            >
              <Sparkles className="size-3 text-chart-1" />
              AI 机会发现 · 有证据、有来源
            </Badge>

            <h1 className="text-balance mx-auto max-w-3xl text-4xl leading-[1.12] font-semibold tracking-tight sm:text-6xl">
              输入一个领域，
              <br className="hidden sm:block" />
              发现当下的契机
            </h1>

            <p className="text-balance mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              自动检索最新的发布、融资、需求与政策动态，提炼出有证据、可追溯来源的机会清单。
            </p>

            <div className="mt-9">
              <SearchBox id="hero-query" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">试试：</span>
              {EXAMPLES.map((topic) => (
                <Link
                  key={topic}
                  href={`/dashboard?q=${encodeURIComponent(topic)}`}
                  className="rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {topic}
                </Link>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-chart-2" />
                真实网页来源
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-chart-2" />
                每个机会附证据
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-chart-2" />
                时效性优先
              </span>
            </div>
          </div>
        </section>

        <section id="features" className="border-b py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                不是灵感清单，是有证据的契机
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                从检索到评估，每个机会都留下可核查的信号与引用。
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="bg-background">
                  <CardContent className="flex gap-4 p-1">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                      <feature.icon className="size-5" />
                    </span>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-semibold">{feature.title}</h3>
                      <p className="text-[13px] leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="example" className="border-b bg-muted/20 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Example report
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  看到证据，而不只是结论
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  摘要、契机卡片、趋势与来源，组成一份可以直接用于决策的报告。
                </p>
              </div>
              <Badge variant="secondary" className="w-fit">
                示例数据，仅作界面演示
              </Badge>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/10">
              <div className="flex h-11 items-center gap-2 border-b bg-muted/40 px-4">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="mx-auto rounded-md bg-background px-3 py-1 text-[10px] text-muted-foreground ring-1 ring-border">
                  qiji.app/report/demo
                </span>
              </div>

              <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="outline" className="h-auto py-0.5 text-[10px]">
                        <Sparkles className="size-2.5" />
                        AI 分析
                      </Badge>
                      <span>10 个来源</span>
                      <span>·</span>
                      <span>12 条机会信号</span>
                      <span>·</span>
                      <span>更新于今天</span>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      AI 漫画领域契机
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      AI 生成工具降低了条漫制作成本，平台对 AI 内容的政策逐步明确，出海与短视频化带来新的分发渠道。
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">契机</th>
                          <th className="px-3 py-2 font-medium">类型</th>
                          <th className="px-3 py-2 font-medium">门槛</th>
                          <th className="px-3 py-2 font-medium">适合</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PREVIEW_ROWS.map((row) => (
                          <tr key={row.name} className="border-t">
                            <td className="px-3 py-2.5 font-medium">{row.name}</td>
                            <td className="px-3 py-2.5">{row.price}</td>
                            <td className="px-3 py-2.5">{row.free}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {row.focus}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <FileSpreadsheet className="size-3.5" />
                    每个契机都保留支撑来源链接
                  </div>
                </div>

                <div className="space-y-6 border-t bg-muted/30 p-6 sm:p-8 lg:border-t-0 lg:border-l">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">时效性评分</h4>
                      <span className="text-[10px] text-muted-foreground">AI 分析 · 1–5</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "AI 条漫代制作", price: 5, width: "100%" },
                        { name: "AI 漫剧短视频", price: 4, width: "80%" },
                        { name: "漫画出海本地化", price: 3, width: "60%" },
                      ].map((item) => (
                        <div key={item.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span>{item.name}</span>
                            <span className="font-medium">{item.price}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-background">
                            <div
                              className="h-full rounded-full bg-chart-1"
                              style={{ width: item.width }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border bg-background p-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Quote className="size-3" />
                      关键发现
                    </div>
                    <ul className="space-y-2 text-[12px] leading-relaxed">
                      <li className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-chart-1" />
                        多家平台近期上线 AI 漫画创作工具，制作成本显著下降。
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-chart-2" />
                        条漫与漫剧短视频成为新的分发与变现形式。
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-chart-3" />
                        平台对 AI 生成内容的标注规则是主要合规风险。
                      </li>
                    </ul>
                  </div>

                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    正式报告中，每个契机都会附支撑来源，并标注过时信息。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                四步，从领域到契机
              </h2>
            </div>

            <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((item) => (
                <li key={item.step} className="bg-background p-5">
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.step}
                  </span>
                  <h3 className="mt-6 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, var(--color-chart-1) 0, transparent 35%), radial-gradient(circle at 80% 60%, var(--color-chart-2) 0, transparent 35%)",
                }}
                aria-hidden
              />
              <div className="relative max-w-2xl">
                <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  准备好发现你的下一个契机了吗？
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-background/70 sm:text-base">
                  免费账号可查看报告摘要与部分数据。需要完整数据和文件时，再按报告解锁。
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="h-11 rounded-lg bg-background px-5 text-foreground hover:bg-background/90"
                  >
                    <Link href="/signup">
                      免费开始
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-lg border-background/25 bg-transparent px-5 text-background hover:bg-background/10 hover:text-background"
                  >
                    <Link href="/login">已有账号，登录</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
