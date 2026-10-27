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
