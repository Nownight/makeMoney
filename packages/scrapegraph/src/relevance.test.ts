import { describe, expect, it } from "vitest";

import { normalizeOpportunity } from "./normalize";
import { domainKeywords, isRelevantOpportunity } from "./relevance";
import { validOpportunity } from "./__fixtures__/opportunity";
import type { Opportunity } from "./opportunity";

const signal = (title: string, summary = "") =>
  normalizeOpportunity({ ...(validOpportunity as Opportunity), title, summary, signals: [], evidence: [], targetAudience: [], monetization: [] });

describe("domainKeywords", () => {
  it("drops generic tokens", () => {
    expect(domainKeywords("AI编程工具")).toEqual(["编程", "程工"]);
    expect(domainKeywords("Cursor 替代品")).toEqual(["cursor", "替代", "代品"]);
    expect(domainKeywords("AI 工具")).toEqual([]);
  });
});

describe("isRelevantOpportunity", () => {
  it("keeps on-domain signals and drops unrelated ones", () => {
    expect(isRelevantOpportunity(signal("某 AI 编程助手完成融资"), "AI编程工具")).toBe(true);
    expect(isRelevantOpportunity(signal("融资", "AI 辅助编程 IDE"), "AI编程工具")).toBe(true);
    expect(isRelevantOpportunity(signal("AI 医疗影像公司完成 B 轮"), "AI编程工具")).toBe(false);
    expect(isRelevantOpportunity(signal("新能源汽车零部件融资"), "AI编程工具")).toBe(false);
  });

  it("keeps everything when the domain has no specific keyword", () => {
    expect(isRelevantOpportunity(signal("任何内容"), "AI 工具")).toBe(true);
  });
});
