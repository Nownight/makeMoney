import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md gap-6 border-0 py-6 shadow-xl shadow-foreground/5 ring-1 ring-border sm:py-7">
      <CardHeader className="space-y-2 px-6 sm:px-8">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-[13px] leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-6 sm:px-8">{children}</CardContent>
      {footer ? (
        <div className="-mt-2 px-6 text-center text-sm text-muted-foreground sm:px-8">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
