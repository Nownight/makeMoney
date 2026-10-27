# 研图 AI（Research SaaS）

输入一个研究主题，自动搜索多个可信网页、提取结构化数据、对比分析，并生成带来源引用的可视化研究报告。

当前仓库已完成 **Phase 2（Report 创建与历史）**。后续阶段严格按 PRD 顺序推进，不一次性铺开全部功能。

---

## 当前进度

| Phase | 内容 | 状态 |
| --- | --- | --- |
| 1 | Next.js / Tailwind / shadcn / Supabase Auth / 登录注册 | ✅ 代码与自动化检查完成，待真实 Supabase 实例做端到端验证 |
| 2 | 创建 Report、Dashboard 历史列表 | ✅ 代码与自动化检查完成，需在 Supabase 执行 migration |
| 3 | ScrapeGraphAI Search + Source 落库 | ⬜ |
| 4 | ScrapeGraphAI Extract + Zod 校验 | ⬜ |
| 5 | LLM 结构化分析 | ⬜ |
| 6 | 报告 UI（摘要 / 表格 / 图表 / 来源） | ⬜ |
| 7 | Background Worker + 进度 | ⬜ |
| 8 | CSV / XLSX / PDF 导出 | ⬜ |
| 9 | Stripe Checkout + Webhook + Entitlement | ⬜ |
| 10 | Usage / Credits / Rate Limit / Admin | ⬜ |

Phase 1 已完成：

- pnpm monorepo（`apps/web`，为 `apps/worker` 与 `packages/*` 预留）
- Next.js 16 App Router + React 19 + TypeScript strict
- Tailwind CSS v4 + shadcn/ui（Radix 基础组件）
- Supabase SSR 客户端（Browser / Server / Proxy 三套）
- 邮箱密码注册、登录、退出
- Magic Link 邮箱登录
- 忘记密码 / 重置密码
- 邮箱验证、PKCE code exchange、token_hash 两种回调格式
- 安全重定向（防 Open Redirect）
- `profiles` 表 + RLS + Auth 触发器 migration
- 登录态路由保护（`/dashboard`、`/report/*`、`/admin`、`/reset-password`）
- 结构化日志基础设施
- 落地页、登录/注册页、控制台骨架
- 55 个单元测试（重定向安全、路由权限、表单校验、错误映射、环境变量、邮件回调）
- `lint` / `typecheck` / `test` / `build` 全部通过

---

## 技术栈

- **Web**：Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS v4、shadcn/ui、Lucide
- **Auth / DB / Storage**：Supabase（Postgres、Auth、RLS；Storage 在 Phase 8 接入）
- **校验**：Zod
- **测试**：Vitest；Playwright 在需要浏览器 E2E 时接入
- **后续**：ScrapeGraphAI Managed API（`scrapegraph-js`）、OpenAI Responses API、Supabase Queues、ExcelJS、Playwright PDF、Stripe

> 已在仓库根目录下载 `Scrapegraph-ai/` 作为参考。**Phase 1 不修改该目录**；MVP 使用托管 API，不自建爬虫集群。

---

## 本地启动

### 前置条件

- Node.js >= 22
- pnpm >= 10
- 本地 Supabase：Docker Desktop + WSL2（Linux 容器）
- 或一个托管 Supabase 项目

```bash
pnpm install
```

### 方式 A：本地 Supabase（推荐）

```bash
# 首次需要 Docker Desktop 的 Linux 引擎可用
pnpm supabase start
pnpm db:reset
```

把 `supabase start` 输出的 **API URL / anon key** 写入 `apps/web/.env.local`：

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase start 输出的 anon key>
```

然后：

```bash
pnpm dev
```

打开 http://localhost:3000 。

本地邮件（注册验证、Magic Link、重置密码）在 Mailpit：http://localhost:54324 。

### 方式 B：托管 Supabase

1. 在 Supabase Dashboard 创建项目。
2. 在 SQL Editor 执行 `supabase/migrations/20261027000000_init_profiles.sql`，或使用 CLI：

   ```bash
   pnpm supabase link --project-ref <ref>
   pnpm supabase db push
   ```

3. 在 **Authentication → URL Configuration** 配置：
   - Site URL：`http://localhost:3000`（生产环境换成正式域名）
   - Redirect URLs：`http://localhost:3000/auth/callback**`
   - 生产环境：`https://your-domain.com/auth/callback**`
4. 将 Project URL 与 publishable/anon key 写入 `apps/web/.env.local`。
5. 生产环境建议开启 **Confirm email**。

### 邮件模板说明

默认邮件模板会走 Supabase 的 `ConfirmationURL`，最终以 **PKCE code** 回到：

```text
/auth/callback?code=...
```

本项目已支持该流程，`/auth/confirm` 也支持自定义模板的 `token_hash` 流程。

如果你把邮件模板改成官方推荐的自定义 token hash 形式，请为每类邮件明确 `type` 与 `next`：

```html
<!-- 注册确认 -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard">
  确认邮箱
</a>

<!-- Magic Link -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard">
  登录
</a>

<!-- 重置密码 -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
  重置密码
</a>
```

不要把 `next` 设成任意外部 URL；服务端只接受同源绝对路径。

---

## 环境变量

复制根目录 `.env.example` 到 `apps/web/.env.local`（Next.js 从应用目录读取环境变量）。

| 变量 | 用途 | 暴露范围 |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | 站点地址、邮件回跳（生产环境必填，本地默认 `http://localhost:3000`） | 浏览器 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | 浏览器 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key | 浏览器（受 RLS 保护） |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端管理操作 | **仅服务器** |
| `SGAI_API_KEY` | ScrapeGraphAI（Phase 3） | **仅服务器** |
| `OPENAI_API_KEY` / `ANALYSIS_MODEL` | LLM 分析（Phase 5） | **仅服务器** |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `REPORT_PRICE` | 支付（Phase 9） | **仅服务器** |

**永远不要**把 `SUPABASE_SERVICE_ROLE_KEY` 放进 `NEXT_PUBLIC_*`，也不要让浏览器直接决定 `isPaid`。

---

## 常用命令

```bash
pnpm dev          # 启动 Web
pnpm build        # 生产构建
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
pnpm test:watch   # Vitest watch

pnpm supabase start   # 本地 Supabase
pnpm db:reset         # 重放 migrations + seed
pnpm db:stop          # 停止本地 Supabase
```

---

## 目录

```text
research-saas/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/login|signup|magic-link|forgot-password|reset-password
│       │   │   ├── auth/callback|confirm
│       │   │   ├── dashboard/
│       │   │   ├── api/health/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/
│       │   │   ├── auth/
│       │   │   ├── layout/
│       │   │   └── ui/
│       │   ├── lib/
│       │   │   ├── auth/        # actions / session / redirect / routes / validation
│       │   │   ├── supabase/    # browser / server / database types
│       │   │   ├── config.ts
│       │   │   └── logger.ts
│       │   └── proxy.ts         # Next.js 16 的 middleware 替代物
│       └── .env.local           # 不提交
├── supabase/
│   ├── migrations/
│   ├── config.toml
│   └── seed.sql
├── docs/architecture.md
├── .env.example
└── AGENTS.md
```

---

## Phase 1 验收清单

| 验收项 | 结果 |
| --- | --- |
| 邮箱注册页面与表单校验 | ✅ |
| 邮箱密码登录 | ✅ 代码完成 |
| Magic Link 登录 | ✅ 代码完成 |
| 邮箱验证 / 密码重置 | ✅ 代码完成 |
| 登录态刷新（Proxy + getClaims） | ✅ |
| 未登录访问 `/dashboard` 重定向登录并保留 next | ✅ 浏览器验证 |
| 已登录访问 `/login` 重定向控制台 | ✅ 单元测试覆盖 |
| RLS：用户只能读写自己的 profile | ✅ migration 已定义 |
| 普通用户不能修改 `plan` / `credits` | ✅ 列级 GRANT 限制 |
| `lint` / `typecheck` / `test` / `build` | ✅ 全部通过 |
| 真实 Supabase 注册 → 登录端到端 | ⏳ 当前机器 Docker/WSL2 不可用，待提供 Supabase 实例后验证 |

### 当前环境的已知阻塞

本机 Docker Desktop 的 Linux 引擎不可用（WSL2 未安装），因此 `supabase start` 无法运行。代码、SQL migration、认证页面与构建均已就绪；完成真实验收需要：

1. 安装 WSL2（`wsl --install`，可能需要重启）并启动 Docker Desktop；或
2. 提供一个托管 Supabase 项目的 URL 与 anon/publishable key。

拿到任一环境后，运行 `pnpm db:reset` 和 `pnpm dev`，按下面的手工用例验证：

1. `/signup` 注册 → （若开启确认）收邮件 → 点击链接 → `/dashboard`
2. 退出 → `/login` 密码登录 → 回到 `next` 指定页面
3. `/magic-link` 收邮件 → 点击 → `/dashboard`
4. `/forgot-password` 收邮件 → 设置新密码 → 登录
5. 直接访问 `/dashboard`（未登录）→ 跳转 `/login?next=/dashboard?...`
6. 在 Supabase SQL Editor 确认 `profiles` 自动创建，且 `plan` / `credits` 无法被前端更新

---

## Phase 2（已完成）

- `supabase/migrations/20261027010000_create_reports.sql`：`reports` 表、索引、RLS（只能读 / 插入自己的行）、列级 GRANT（浏览器只能写 `user_id`、`query`、`source_limit`、`language`；无 update/delete）。
- `POST /api/reports`：需登录（否则 401）；Zod 校验 `{ query: 1..200, sourceLimit: 5|10|20 = 5, language? }`；创建 `queued` 报告并返回 `201 { id, status }`。
- **Free 计划来源上限**：服务端按 `profiles.plan` 把 `sourceLimit` **静默收敛为 5**（不报错），Pro 保留请求值。
- Dashboard 搜索表单（Server Action，与 API 共用 `lib/reports/create.ts`）→ 跳转 `/report/[id]`；最近报告列表与报告数量。
- `/report/[id]`：登录保护，RLS 读取，他人或不存在的报告返回 404；展示主题、状态、进度、创建时间。
- 本阶段**不扣额度、不执行研究**。

## 下一步（Phase 3）

ScrapeGraphAI Search + `sources` 落库。
