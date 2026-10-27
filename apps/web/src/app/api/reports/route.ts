import { NextResponse } from "next/server";

import { createReportForCurrentUser } from "@/lib/reports/create";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const result = await createReportForCurrentUser(body);

  if (result.ok) {
    return NextResponse.json(
      { id: result.id, status: result.status },
      { status: 201 },
    );
  }

  switch (result.code) {
    case "unauthorized":
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    case "invalid_input":
      return NextResponse.json(
        { error: "参数不合法", fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    case "server_error":
      return NextResponse.json({ error: "创建报告失败" }, { status: 500 });
  }
}
