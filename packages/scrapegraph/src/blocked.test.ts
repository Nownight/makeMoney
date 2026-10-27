import { describe, expect, it } from "vitest";

import { hasBlockedMarkers, looksBlocked } from "./blocked";

const long = "这是一个正常的产品介绍页面，包含功能、价格和用户评价等大量正文内容。".repeat(3);

describe("looksBlocked", () => {
  it.each([
    '{"error":{"message":"您当前请求存在异常，暂时限制本次访问。如有疑问，您可以通过手机摇一摇或登录后私信知乎小管家反馈。","code":40362}}',
    "Just a moment... Checking your browser before accessing example.com. " + long,
    "Access Denied - You don't have permission to access this server. " + long,
    "Please enable JavaScript and cookies to continue " + long,
    "请输入验证码以继续访问 " + long,
    "访问受限，请稍后再试 " + long,
    "<div id=\"cf-challenge-running\"></div>" + long,
    "Not found",
  ])("flags %s", (text) => {
    expect(looksBlocked(text)).toBe(true);
  });

  it("passes normal and empty content", () => {
    expect(looksBlocked(long)).toBe(false);
    expect(looksBlocked("")).toBe(false);
    expect(looksBlocked("   ")).toBe(false);
  });

  it("checks markers independent of length", () => {
    expect(hasBlockedMarkers("ok")).toBe(false);
    expect(hasBlockedMarkers('{"code": 40362, "message": "x"}')).toBe(true);
  });
});
