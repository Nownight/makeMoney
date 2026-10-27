"use client";

import { Search } from "lucide-react";
import { useActionState } from "react";

import { FieldError } from "@/components/auth/field-error";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import {
  createReportAction,
  type CreateReportFormState,
} from "@/lib/reports/actions";
import { SOURCE_LIMITS } from "@/lib/reports/validation";

const initialState: CreateReportFormState = { status: "idle" };

export function CreateReportForm({
  defaultQuery,
  maxSourceLimit,
}: {
  defaultQuery?: string;
  maxSourceLimit: number;
}) {
  const [state, formAction] = useActionState(createReportAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="query"
          defaultValue={defaultQuery}
          placeholder="输入研究主题，例如：主流 AI 笔记工具对比"
          maxLength={200}
          required
          aria-label="研究主题"
          aria-invalid={Boolean(state.fieldErrors?.query)}
          className="h-10 flex-1"
        />
        <select
          name="sourceLimit"
          defaultValue="5"
          aria-label="来源数量"
          className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          {SOURCE_LIMITS.map((limit) => (
            <option key={limit} value={limit} disabled={limit > maxSourceLimit}>
              {limit} 个来源{limit > maxSourceLimit ? "（Pro）" : ""}
            </option>
          ))}
        </select>
        <SubmitButton className="h-10" pendingLabel="创建中…">
          <Search />
          开始研究
        </SubmitButton>
      </div>
      <FieldError messages={state.fieldErrors?.query} />
      <FieldError messages={state.fieldErrors?.sourceLimit} />
      {state.status === "error" && state.message ? (
        <FormMessage state={state} />
      ) : null}
    </form>
  );
}
