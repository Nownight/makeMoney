import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "契机 AI · 输入一个领域，发现当下的机会",
    template: "%s · 契机 AI",
  },
  description:
    "输入你关心的任意领域，自动检索最新的发布、融资、需求与政策动态，发现有证据、可追溯来源的当下契机。",
  applicationName: "契机 AI",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "契机 AI",
    title: "契机 AI · 发现你关心领域的最新契机",
    description:
      "自动搜索多个可信来源、提取关键数据、对比分析，并生成可直接下载的可视化报告。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
