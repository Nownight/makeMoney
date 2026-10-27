import type { AnalysisInputItem, ReportAnalysis } from "../schema";

/**
 * EXAMPLE DATA ONLY — hand-written, not scraped; companies, events and dates
 * are fictional. Used by tests and `pnpm try-analyze` to exercise the LLM
 * provider with opportunity signals (normalized_data shape, opportunity-v1).
 */
const opportunity = (fields: {
  title: string;
  type: string;
  summary: string;
  signals: string[];
  eventDate: string | null;
  monetization?: string[];
  entryBarrier?: "low" | "medium" | "high" | null;
  competition?: "low" | "medium" | "high" | null;
  targetAudience?: string[];
}) => ({
  evidence: [],
  monetization: [],
  entryBarrier: null,
  competition: null,
  targetAudience: [],
  ...fields,
});

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const sourceId = (n: number) => `10000000-0000-4000-8000-00000000000${n}`;

export const exampleItems: AnalysisInputItem[] = [
  {
    itemId: id(1),
    sourceId: sourceId(1),
    sourceUrl: "https://example.com/news/ai-comic-tool-launch",
    domain: "example.com",
    data: opportunity({
      title: "示例平台上线 AI 条漫生成工具 (example)",
      type: "new_tool",
      summary: "示例平台发布 AI 条漫生成工具，支持分镜与上色，面向个人作者开放。",
      signals: ["上线首周注册用户 10 万 (example)"],
      eventDate: "2026-09-12",
      monetization: ["按月订阅", "按张付费"],
      entryBarrier: "low",
      competition: "medium",
      targetAudience: ["个人漫画作者", "小型工作室"],
    }),
  },
  {
    itemId: id(2),
    sourceId: sourceId(2),
    sourceUrl: "https://example.com/news/ai-comic-funding",
    domain: "example.com",
    data: opportunity({
      title: "示例 AI 漫剧公司完成 A 轮融资 (example)",
      type: "capital",
      summary: "一家示例 AI 漫剧公司宣布完成数千万元 A 轮融资，用于短视频漫剧产能扩张。",
      signals: ["融资金额数千万元 (example)"],
      eventDate: "2026-08-03",
      monetization: ["短视频平台分账", "品牌定制"],
      entryBarrier: "medium",
      competition: "medium",
      targetAudience: ["内容创作者"],
    }),
  },
  {
    itemId: id(3),
    sourceId: sourceId(3),
    sourceUrl: "https://example.org/blog/comic-localization-demand",
    domain: "example.org",
    data: opportunity({
      title: "海外读者对中文条漫本地化需求增长 (example)",
      type: "new_demand",
      summary: "示例博客称海外平台上中文条漫翻译版阅读量增长，但译制产能不足。",
      signals: ["译制排期超过 2 个月 (example)"],
      eventDate: "2026-06-20",
      monetization: ["译制外包", "海外平台分成"],
      entryBarrier: "medium",
      competition: "low",
      targetAudience: ["翻译团队", "出海运营"],
    }),
  },
  {
    itemId: id(4),
    sourceId: sourceId(4),
    sourceUrl: "https://example.net/policy/ai-content-label",
    domain: "example.net",
    data: opportunity({
      title: "AI 生成内容标识规则 (example)",
      type: "policy_change",
      summary: "示例文章介绍平台要求对 AI 生成的图片与视频进行显著标识。",
      signals: [],
      eventDate: "2025-03-01",
      entryBarrier: null,
      competition: null,
    }),
  },
];

export const exampleAnalysis: ReportAnalysis = {
  title: "AI 漫画领域契机（示例）",
  executiveSummary:
    "示例数据显示，AI 条漫工具降低了制作门槛，资本开始进入 AI 漫剧赛道，海外本地化需求存在供给缺口。",
  topOpportunities: [
    {
      itemIds: [id(1)],
      name: "AI 条漫代制作服务",
      whyNow: "新工具刚上线，多数作者尚未熟练使用。",
      whoFits: "有分镜经验的个人作者或小团队。",
      howToStart: "用新工具做 3 套样稿，在作者社区接单。",
      risks: ["工具同质化后价格下降"],
      scores: { timeliness: 5, evidence: 3, feasibility: 4 },
    },
    {
      itemIds: [id(2)],
      name: "AI 漫剧短视频",
      whyNow: "近期融资事件说明资本关注该形式。",
      whoFits: "熟悉短视频平台的内容创作者。",
      howToStart: "改编公版故事做 5 集试水。",
      risks: ["平台审核规则变化"],
      scores: { timeliness: 4, evidence: 3, feasibility: 3 },
    },
    {
      itemIds: [id(3)],
      name: "条漫出海本地化",
      whyNow: "译制排期长，供给不足。",
      whoFits: "具备外语能力的翻译团队。",
      howToStart: "与中小版权方谈分成合作。",
      risks: ["版权授权周期长"],
      scores: { timeliness: 3, evidence: 2, feasibility: 3 },
    },
  ],
  trends: ["制作成本下降", "内容形式向短视频迁移"],
  warnings: ["示例数据，非真实来源。", "政策条目的日期超过 12 个月，可能已过时。"],
  charts: [],
};
