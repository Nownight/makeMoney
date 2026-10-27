import type { AnalysisInputItem, ReportAnalysis } from "../schema";

/**
 * EXAMPLE DATA ONLY — hand-written, not scraped, prices may be outdated.
 * Used by tests and `pnpm try-analyze` to exercise the LLM provider.
 */
const product = (
  name: string,
  company: string,
  pricing: Array<{ plan: string; amount: number | null; currency: string | null; period: "month" | "year" | "once" | null }>,
  freePlan: boolean | null,
  features: string[],
  limitations: string[] = [],
) => ({
  name,
  company,
  category: "AI 编程工具",
  pricing,
  freePlan,
  features,
  targetUsers: ["开发者"],
  advantages: [],
  limitations,
  sourceEvidence: [],
});

export const exampleItems: AnalysisInputItem[] = [
  {
    itemId: "00000000-0000-4000-8000-000000000001",
    sourceId: "10000000-0000-4000-8000-000000000001",
    sourceUrl: "https://example.com/cursor-pricing",
    domain: "example.com",
    data: product(
      "Cursor (example)",
      "Anysphere",
      [
        { plan: "Hobby", amount: 0, currency: null, period: null },
        { plan: "Pro", amount: 20, currency: "USD", period: "month" },
        { plan: "Business", amount: 40, currency: "USD", period: "month" },
      ],
      true,
      ["Tab 补全", "Agent 模式", "多模型切换", "代码库索引"],
    ),
  },
  {
    itemId: "00000000-0000-4000-8000-000000000002",
    sourceId: "10000000-0000-4000-8000-000000000002",
    sourceUrl: "https://example.com/copilot-pricing",
    domain: "example.com",
    data: product(
      "GitHub Copilot (example)",
      "GitHub",
      [
        { plan: "Free", amount: 0, currency: null, period: null },
        { plan: "Pro", amount: 10, currency: "USD", period: "month" },
        { plan: "Pro+", amount: 39, currency: "USD", period: "month" },
      ],
      true,
      ["代码补全", "Chat", "PR 摘要"],
      ["免费版有使用次数限制"],
    ),
  },
  {
    itemId: "00000000-0000-4000-8000-000000000003",
    sourceId: "10000000-0000-4000-8000-000000000003",
    sourceUrl: "https://example.org/windsurf",
    domain: "example.org",
    data: product(
      "Windsurf (example)",
      "Windsurf",
      [
        { plan: "Free", amount: 0, currency: null, period: null },
        { plan: "Pro", amount: 15, currency: "USD", period: "month" },
      ],
      true,
      ["Cascade Agent", "代码补全"],
    ),
  },
  {
    itemId: "00000000-0000-4000-8000-000000000004",
    sourceId: "10000000-0000-4000-8000-000000000004",
    sourceUrl: "https://example.cn/tongyi-lingma",
    domain: "example.cn",
    data: product(
      "通义灵码 (example)",
      "阿里云",
      [{ plan: "个人版", amount: 0, currency: null, period: null }],
      true,
      ["代码补全", "单元测试生成", "代码解释"],
    ),
  },
];

/** A valid analysis referencing the example ids. */
export const exampleAnalysis: ReportAnalysis = {
  title: "AI 编程工具对比",
  executiveSummary: "四款工具均提供免费版。付费版价格在 10 到 40 美元/月之间。Cursor 功能最多。",
  keyFindings: ["均有免费版", "Copilot Pro 最便宜", "Cursor 功能数量最多"],
  comparisonDimensions: ["价格", "功能数量"],
  rankings: [
    {
      title: "最低付费价格",
      metric: "USD/月",
      isSubjective: false,
      items: [
        { itemId: "00000000-0000-4000-8000-000000000002", value: 10 },
        { itemId: "00000000-0000-4000-8000-000000000003", value: 15 },
      ],
    },
  ],
  charts: [
    {
      type: "bar",
      title: "功能数量",
      description: "各工具列出的功能数",
      xKey: "name",
      yKeys: ["featureCount"],
      sourceItemIds: ["00000000-0000-4000-8000-000000000001"],
    },
  ],
  conclusions: ["预算有限可先用免费版"],
  warnings: [],
};
