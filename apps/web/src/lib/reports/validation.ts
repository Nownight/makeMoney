import { z } from "zod";

import type { ReportSourceLimit, UserPlan } from "@/lib/supabase/database.types";

export const SOURCE_LIMITS = [5, 10, 20] as const satisfies readonly ReportSourceLimit[];

export const FREE_PLAN_SOURCE_LIMIT: ReportSourceLimit = 5;

export const createReportSchema = z.object({
  query: z
    .string("请输入研究主题")
    .trim()
    .min(1, "请输入研究主题")
    .max(200, "研究主题最多 200 个字符"),
  sourceLimit: z
    .union([z.literal(5), z.literal(10), z.literal(20)], "来源数量只能是 5、10 或 20")
    .default(5),
  language: z
    .string()
    .trim()
    .max(20, "语言代码过长")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Free users are silently clamped to 5 sources instead of rejected: the UI
 * already only offers what the plan allows, so clamping is the simpler path.
 */
export function clampSourceLimit(
  requested: ReportSourceLimit,
  plan: UserPlan,
): ReportSourceLimit {
  return plan === "pro" ? requested : FREE_PLAN_SOURCE_LIMIT;
}
