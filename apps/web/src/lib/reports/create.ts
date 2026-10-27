import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { logEvent, logError } from "@/lib/logger";
import { runSourceSearch } from "@/lib/reports/search-pipeline";
import { clampSourceLimit, createReportSchema } from "@/lib/reports/validation";
import type { ReportStatus } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CreateReportResult =
  | { ok: true; id: string; status: ReportStatus }
  | { ok: false; code: "unauthorized" }
  | {
      ok: false;
      code: "invalid_input";
      fieldErrors: Record<string, string[] | undefined>;
    }
  | { ok: false; code: "server_error" };

/**
 * Single code path for creating a report, shared by POST /api/reports and the
 * dashboard Server Action. Inserts a queued row, then (Phase 3, temporary
 * until the worker) runs the source search synchronously. No credits are
 * deducted yet.
 */
export async function createReportForCurrentUser(
  rawInput: unknown,
): Promise<CreateReportResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, code: "unauthorized" };
  }

  const parsed = createReportSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid_input",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const sourceLimit = clampSourceLimit(
    parsed.data.sourceLimit,
    profile?.plan ?? "free",
  );

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      query: parsed.data.query,
      source_limit: sourceLimit,
      language: parsed.data.language ?? null,
    })
    .select("id, status")
    .single();

  if (error || !data) {
    logError("report.create.failed", error ?? "no row returned", {
      userId: user.id,
    });
    return { ok: false, code: "server_error" };
  }

  logEvent("info", "report.created", {
    reportId: data.id,
    userId: user.id,
    sourceLimit,
  });

  await runSourceSearch({ id: data.id, query: parsed.data.query, sourceLimit });

  const { data: latest } = await supabase
    .from("reports")
    .select("status")
    .eq("id", data.id)
    .maybeSingle();

  return { ok: true, id: data.id, status: latest?.status ?? data.status };
}
