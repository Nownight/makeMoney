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
    default: "研图 AI · 输入一个主题，生成可下载的研究报告",
    template: "%s · 研图 AI",
  },
  description:
    "输入一个研究主题，自动搜索多个可信来源、提取结构化数据、对比分析，并生成带来源引用的可视化研究报告。",
  applicationName: "研图 AI",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "研图 AI",
    title: "研图 AI · 自动研究与可视化报告",
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
