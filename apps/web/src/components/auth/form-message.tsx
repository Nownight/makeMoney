"use client";

import { CircleAlert, CircleCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AuthFormState } from "@/lib/auth/actions";

type FormMessageProps = {
  state: AuthFormState;
};

export function FormMessage({ state }: FormMessageProps) {
  if (state.status === "error" && state.message) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>无法完成操作</AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }

  if (state.status === "success" && state.message) {
    return (
      <Alert>
        <CircleCheck />
        <AlertTitle>请查收邮件</AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
