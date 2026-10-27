import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "请输入邮箱")
  .max(254, "邮箱过长")
  .pipe(z.email("邮箱格式不正确"));

const strongPasswordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(72, "密码最多 72 位")
  .regex(/[A-Za-z]/, "密码需包含字母")
  .regex(/[0-9]/, "密码需包含数字");

const passwordConfirmationSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "请再次输入密码"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "请输入密码").max(72, "密码最多 72 位"),
});

export const signUpSchema = passwordConfirmationSchema.extend({
  email: emailSchema,
  displayName: z
    .string()
    .trim()
    .max(50, "昵称最多 50 个字符")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = passwordConfirmationSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
