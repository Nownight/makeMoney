import type { ReportStatus } from "@/lib/supabase/database.types";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  queued: "排队中",
  searching: "搜索来源",
  extracting: "提取数据",
  normalizing: "数据归一化",
  analyzing: "分析中",
  rendering: "生成报告",
  completed: "已完成",
  failed: "失败",
};

export function reportStatusLabel(status: string): string {
  return Object.hasOwn(REPORT_STATUS_LABELS, status)
    ? REPORT_STATUS_LABELS[status as ReportStatus]
    : "未知状态";
}

export function reportStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "queued") return "outline";
  return "secondary";
}

/** Clamps progress into 0..100 so the bar never overflows. */
export function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Honest status line for the report page (non-failed reports). A queued
 * report with progress > 0 was left behind by an older pipeline version and
 * will not continue on its own.
 */
export function reportStatusMessage(input: {
  status: string;
  progress: number;
  extractedCount: number;
  sourceCount: number;
}): string {
  const counts = `${input.extractedCount} / ${input.sourceCount}`;
  switch (input.status) {
    case "completed":
      return `成功分析 ${counts} 个来源。`;
    case "analyzing":
      return `成功提取 ${counts} 个来源，正在进行 AI 分析…`;
    case "extracting":
    case "normalizing":
      return "来源已就绪，正在提取结构化数据…";
    case "searching":
      return "正在搜索数据来源…";
    case "queued":
      return input.progress > 0
        ? "分析未完成（报告由旧版本流程创建），请重新创建报告。"
        : "报告已创建并进入队列。来源搜索完成后会在此页面展示。";
    default:
      return "报告处理中…";
  }
}
