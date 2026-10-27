type AuthErrorLike = {
  message?: string;
  code?: string;
  status?: number;
} | null;

const ERROR_MESSAGES: Array<{ test: RegExp; message: string }> = [
  {
    test: /invalid login credentials/i,
    message: "邮箱或密码不正确",
  },
  {
    test: /email not confirmed/i,
    message: "邮箱尚未验证，请先查收验证邮件",
  },
  {
    test: /user already registered/i,
    message: "该邮箱已注册，请直接登录",
  },
  {
    test: /password should be at least|weak password/i,
    message: "密码强度不足，请使用至少 8 位且包含字母和数字的密码",
  },
  {
    test: /rate limit|too many requests|for security purposes/i,
    message: "操作过于频繁，请稍后再试",
  },
  {
    test: /invalid email/i,
    message: "邮箱格式不正确",
  },
  {
    test: /signup.*disabled|signups? not allowed/i,
    message: "当前暂未开放注册",
  },
  {
    test: /fetch failed|network|timeout/i,
    message: "网络异常，请稍后重试",
  },
];

export function toAuthErrorMessage(error: AuthErrorLike): string {
  if (!error) {
    return "操作失败，请稍后重试";
  }

  const raw = error.message ?? "";

  for (const entry of ERROR_MESSAGES) {
    if (entry.test.test(raw)) {
      return entry.message;
    }
  }

  return "操作失败，请稍后重试";
}
