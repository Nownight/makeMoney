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

const EXAMPLES = [
  "AI 编程工具",
  "AI 视频生成工具",
  "CRM 软件",
  "新能源汽车品牌",
  "AI 客服 SaaS",
];

const FEATURES = [
  {
    icon: Globe,
    title: "多源真实检索",
    description:
      "先搜索网页，再读取内容，而不是让模型凭记忆作答。优先官网、产品页与权威媒体。",
  },
  {
    icon: Layers,
    title: "固定 Schema 提取",
    description:
      "把混乱的网页统一成结构化数据：价格、套餐、功能、目标用户与证据原文。",
  },
  {
    icon: ChartNoAxesCombined,
    title: "自动选择可视化",
    description:
      "系统根据数据类型决定表格、柱状图或折线图，不生成无意义的图表。",
  },
  {
    icon: ShieldCheck,
    title: "来源可追溯",
    description:
      "关键数据保留来源链接、抓取时间与置信度，方便核对，而不是只给结论。",
  },
];

const STEPS = [
  {
    step: "01",
    title: "输入研究主题",
    description: "用一句自然语言描述你想比较的产品、公司或市场。",
  },
  {
    step: "02",
    title: "搜索与筛选来源",
    description: "发现相关网页，过滤重复、低质量与无关页面，只保留可信来源。",
  },
  {
    step: "03",
    title: "提取并标准化数据",
    description: "按统一结构读取每个页面，校验价格、日期与缺失字段。",
  },
  {
    step: "04",
    title: "分析与生成报告",
    description: "归纳差异、生成排名和图表，并导出 CSV、Excel 或 PDF。",
  },
];

const PREVIEW_ROWS = [
  { name: "Cursor", price: "$20", free: "有", focus: "专业开发者" },
  { name: "Copilot", price: "$10", free: "有", focus: "团队协作" },
  { name: "Windsurf", price: "$15", free: "有", focus: "快速上手" },
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
          研究主题
        </label>
        <input
          id={id}
          name="q"
          type="search"
          required
          minLength={2}
          maxLength={120}
          autoComplete="off"
          placeholder="例如：AI 编程工具"
          className="h-12 w-full rounded-xl border border-border bg-background pr-4 pl-11 text-base shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 shrink-0 rounded-xl px-6 text-sm"
      >
        开始研究
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
              AI 竞品研究 · 自动生成可视化报告
            </Badge>

            <h1 className="text-balance mx-auto max-w-3xl text-4xl leading-[1.12] font-semibold tracking-tight sm:text-6xl">
              搜一个主题，
              <br className="hidden sm:block" />
              AI 自动研究整个互联网
            </h1>

            <p className="text-balance mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              自动搜索多个可信来源、提取关键数据、比较分析，并生成可直接下载的可视化报告。
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
                结构化对比数据
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-chart-2" />
                免费查看报告摘要
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
                不是聊天，是一份研究报告
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                从发现来源到导出文件，每一步都留下可核查的数据与引用。
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
                  看到数据，而不只是结论
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  摘要、对比表、关键发现、图表与来源，组成一份可以直接用于决策的报告。
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
                  yantu.app/report/demo
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
                      <span>24 个数据点</span>
                      <span>·</span>
                      <span>更新于今天</span>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      AI 编程工具竞品研究
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      主流 AI 编程助手在定价、免费额度与目标用户上的差异。专业开发者更关注上下文能力与编辑器集成，团队采购则更看重统一计费与权限管理。
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">产品</th>
                          <th className="px-3 py-2 font-medium">月费</th>
                          <th className="px-3 py-2 font-medium">免费版</th>
                          <th className="px-3 py-2 font-medium">定位</th>
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
                    可导出 CSV / XLSX / PDF，并保留每行来源链接
                  </div>
                </div>

                <div className="space-y-6 border-t bg-muted/30 p-6 sm:p-8 lg:border-t-0 lg:border-l">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">月费对比</h4>
                      <span className="text-[10px] text-muted-foreground">USD / 月</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Cursor", price: 20, width: "100%" },
                        { name: "Windsurf", price: 15, width: "75%" },
                        { name: "Copilot", price: 10, width: "50%" },
                      ].map((item) => (
                        <div key={item.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span>{item.name}</span>
                            <span className="font-medium">${item.price}</span>
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
                        个人版价格集中在 $10–$20 / 月，免费额度是主要获客手段。
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-chart-2" />
                        企业版普遍不公开单价，转向按席位或用量报价。
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-chart-3" />
                        定价差异之外，模型选择与上下文长度是第二竞争维度。
                      </li>
                    </ul>
                  </div>

                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    正式报告中，每个关键数据点都会附来源链接与抓取时间。
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
                四步，从主题到报告
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
                  准备好研究你的下一个市场了吗？
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
