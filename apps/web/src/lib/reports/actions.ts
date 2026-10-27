"use server";

import { redirect } from "next/navigation";

import { createReportForCurrentUser } from "@/lib/reports/create";

export type CreateReportFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function readField(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

export async function createReportAction(
  _previousState: CreateReportFormState,
  formData: FormData,
): Promise<CreateReportFormState> {
  const sourceLimit = Number(readField(formData, "sourceLimit") ?? 5);

  const result = await createReportForCurrentUser({
    query: readField(formData, "query") ?? "",
    sourceLimit,
  });

  if (result.ok) {
    redirect(`/report/${result.id}`);
  }

  switch (result.code) {
    case "unauthorized":
      redirect("/login?next=/dashboard");
    case "invalid_input":
      return {
        status: "error",
        message: "请检查输入内容",
        fieldErrors: result.fieldErrors,
      };
    case "server_error":
      return { status: "error", message: "创建报告失败，请稍后重试" };
  }
}
