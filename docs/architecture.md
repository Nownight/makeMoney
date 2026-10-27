# 架构说明

本文描述研图 AI 的整体架构、阶段边界与安全不变量。Phase 1 实现账号体系与项目骨架，Phase 2 增加 reports 创建与历史，后续阶段按路线图逐段补齐。

---

## 1. 产品边界

研图 AI 是一个**垂直研究工具**，不是通用搜索引擎。

- 输入：一个产品 / 公司 / 工具 / 服务的对比研究主题。
- 过程：搜索可信来源 → 抓取正文 → 提取结构化字段 → LLM 对比分析 → 生成图表规格。
- 输出：带来源引用、可导出、可追溯的可视化报告。

明确不做：

- 通用网页搜索产品。
- 自建爬虫集群（MVP 使用 ScrapeGraphAI Managed API）。
- 让模型直接生成图表 React 代码（只允许结构化 `ChartSpec`）。
- 在 HTTP 请求内同步跑完整个研究流程（必须走队列 + Worker）。

---

## 2. 仓库结构

```text
research-saas/
├── apps/
│   ├── web/                 # Next.js 16 App Router（当前唯一应用）
│   └── worker/              # Phase 7 预留：队列消费者
├── packages/
│   ├── shared/              # 预留：Zod schema、领域类型、ChartSpec
│   └── adapters/            # 预留：ScrapeGraphAI / LLM / 导出适配器
├── supabase/
│   ├── migrations/          # 数据库结构、RLS、触发器
│   ├── config.toml          # 本地 Supabase 配置
│   └── seed.sql             # 本地种子数据
├── docs/architecture.md
└── AGENTS.md
```

约定：

- `apps/web` 只负责 UI、Server Actions、Route Handlers 和读模型。
- 所有第三方 API 调用都放在适配器后面，业务代码不直接依赖厂商 SDK。
- 跨应用共享的类型与校验放在 `packages/shared`，避免 Web 与 Worker 各写一份。

---

## 3. 阶段路线图

| Phase | 范围 | 关键产物 |
| --- | --- | --- |
| 1 | 项目框架 + 账号体系 | Next.js、Tailwind、shadcn、Supabase Auth、profiles、路由保护 |
| 2 | Report 创建与历史 | `reports` 表 + RLS、`POST /api/reports`、Dashboard 列表、`/report/[id]` 壳 |
| 3 | 来源搜索 | ScrapeGraphAI Search、`sources` 落库、来源去重与限流 |
| 4 | 结构化提取 | ScrapeGraphAI Extract、Zod 校验、归一化、部分失败处理 |
| 5 | LLM 分析 | 结构化分析结果、`ChartSpec`、引用绑定 |
| 6 | 报告 UI | 摘要、对比表、图表、来源列表、空态与错误态 |
| 7 | 后台任务 | Supabase Queues + Worker、进度、重试、超时、幂等 |
| 8 | 导出 | CSV / XLSX / PDF、Storage 签名 URL |
| 9 | 支付 | Stripe Checkout / Webhook、entitlement、幂等入账 |
| 10 | 成本与运营 | Usage、Credits、Rate Limit、Admin、审计 |

**纪律：** 每个阶段完成后必须通过 `lint`、`typecheck`、`test`、`build`，再进入下一阶段。未完成的阶段不提前接入其依赖。

---

## 4. Phase 1 运行时架构

### 4.1 请求路径

```text
Browser
  │
  ├─ 页面 / Server Action
  │     └─ Next.js App Router (apps/web)
  │           ├─ Server Component  ── createClient() ── Supabase (Postgres + Auth)
  │           └─ Server Action     ── createClient() ── Supabase Auth
  │
  └─ 任意请求 ── src/proxy.ts
                   ├─ 刷新 Supabase 会话 Cookie
                   ├─ getClaims() 验证访问令牌
                   └─ decideRouteAccess() 执行路由策略
```

### 4.2 Supabase 客户端

| 文件 | 用途 | 约束 |
| --- | --- | --- |
| `src/lib/supabase/client.ts` | 浏览器组件 | 只使用 anon/publishable key |
| `src/lib/supabase/server.ts` | Server Component / Server Action / Route Handler | 每次请求新建，不跨请求缓存 |
| `src/proxy.ts` 内联客户端 | 会话刷新与路由守卫 | 必须把刷新后的 Cookie 写回响应 |

`SUPABASE_SERVICE_ROLE_KEY` 只允许出现在服务端脚本或 Worker，绝不进入浏览器 bundle。

### 4.3 认证流程

支持两种邮件回调格式：

1. **PKCE code（默认模板）**
   `邮件链接 → /auth/callback?code=... → exchangeCodeForSession() → 跳转 next`
2. **Token hash（自定义模板）**
   `邮件链接 → /auth/confirm?token_hash=...&type=... → verifyOtp() → 跳转 next`

两种路径共用 `src/lib/auth/callback.ts`，避免行为分叉。

已实现的账号能力：

- 邮箱 + 密码注册 / 登录
- Magic Link 登录
- 忘记密码 / 重置密码
- 邮箱确认（PKCE 与 token hash）
- 退出登录
- 登录态刷新与受保护路由跳转

### 4.4 路由策略

策略集中在 `src/lib/auth/routes.ts`，由 `src/proxy.ts` 调用：

- 受保护前缀：`/dashboard`、`/report`、`/admin`、`/reset-password`
- 登录入口前缀：`/login`、`/signup`、`/magic-link`
- 未登录访问受保护路径 → `/login?next=<原路径>`
- 已登录访问登录入口 → `/dashboard`

页面层还有第二道检查（`getCurrentUser()`），不能只依赖 Proxy。

### 4.5 数据模型（Phase 1）

```sql
profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  plan user_plan not null default 'free',
  credits integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

安全不变量：

1. 用户只能 `SELECT` 自己的 profile。
2. 用户只能 `UPDATE display_name`；`plan`、`credits` 由服务端控制。
3. profile 行由 `auth.users` 上的 security-definer 触发器创建，浏览器不能插入。
4. `anon` 对 `profiles` 没有任何权限。
5. 所有服务端授权判断都基于 `auth.getClaims()`，不信任前端传入的用户 ID。

### 4.6 数据模型（Phase 2）

`reports` 见 `supabase/migrations/20261027010000_create_reports.sql`。安全不变量：

1. 用户只能 `SELECT` 自己的 report；只能 `INSERT` `user_id = auth.uid()` 的行，且只能写 `user_id`、`query`、`source_limit`、`language` 列。
2. `status`、`progress`、结果字段与 `is_paid` 只由 service role（后续 worker）写入；客户端无 update/delete。
3. Free 计划的 `source_limit` 由服务端收敛为 5。
4. `POST /api/reports` 与 Dashboard Server Action 共用 `createReportForCurrentUser()`。

### 4.7 来源搜索（Phase 3）

- `packages/scrapegraph` 是唯一调用 ScrapeGraphAI 的地方（Web 与未来的 Worker 共用），响应先经 Zod 校验。
- `sources` 只允许读取父报告属于 `auth.uid()` 的行；所有写入走服务端 service role 客户端（`lib/supabase/admin.ts`）。
- 状态：搜索成功后报告回到 `queued`（progress 20）等待提取，不引入新状态；失败为 `failed` + `error_message`。

---

## 5. 后续阶段的数据流（设计约束）

```text
POST /api/reports
  → 校验输入（Zod）
  → 创建 reports(status = queued)
  → 扣减/预占额度（事务）
  → 入队
  → 立即返回 report id

Worker
  → 领取任务（幂等、带租约）
  → Search 适配器 → sources
  → Extract 适配器 → Zod 校验 → normalized data
  → LLM 分析 → 结构化结果 + ChartSpec
  → 写入 report 结果、usage_logs
  → status = completed / partial / failed
```

### 5.1 必须遵守的不变量

- **来源可追溯**：每个结论字段都能关联到 `sources` 记录与原始 URL。
- **结构化输出**：LLM 只返回 JSON，经 Zod 校验后入库；图表只接受 `ChartSpec`。
- **部分失败**：单个来源失败不应让整份报告失败；报告可标记 `partial`。
- **幂等**：队列消息、支付 Webhook、导出任务都必须可重复执行而不重复扣费。
- **成本上限**：每次任务有来源数、token、重试次数上限；超限即停止并记录原因。
- **提示注入防御**：网页内容一律视为不可信数据，不进入系统指令；分析提示与页面文本严格隔离。
- **SSRF 防御**：抓取目标必须经过协议、主机、DNS、私网地址校验；禁止 `file:`、`localhost`、内网网段。
- **服务端定价**：价格、`isPaid`、`plan`、`credits` 只由服务端决定。

---

## 6. 可观测性与错误处理

- `src/lib/logger.ts` 输出结构化 JSON 日志，认证失败只记录错误码与状态，不记录密码、令牌或完整邮箱。
- Server Action 返回可展示的错误文案；底层错误先经 `src/lib/auth/errors.ts` 映射。
- 回调失败统一跳转 `/login?error=expired_link` 或 `invalid_link`，不泄漏内部细节。
- `/api/health` 提供最小健康检查，供部署平台探活。

---

## 7. 测试策略

| 层级 | 工具 | 覆盖内容 |
| --- | --- | --- |
| 单元测试 | Vitest | 重定向安全、路由权限矩阵、表单校验、错误映射、环境变量解析 |
| 类型检查 | `tsc --noEmit` | 严格模式、Supabase 数据库类型 |
| 构建 | `next build` | App Router 路由、Server/Client 边界、环境变量 |
| 端到端 | 待接入 Playwright | 真实 Supabase 注册 / 登录 / 重置密码 |

Phase 1–4 的 135 个单元测试（web 82 + scrapegraph 53）集中在纯函数与边界条件，避免依赖网络或数据库。

---

## 8. 环境与部署

- 本地：Supabase CLI（Docker + WSL2）或托管 Supabase 项目。
- Web：Vercel 或任意 Node.js 运行时；Proxy 运行在 Edge Runtime。
- 环境变量分两层：
  - `NEXT_PUBLIC_*`：可公开，构建时内联。
  - 服务端密钥：只在服务端读取，部署时注入。
- 生产环境必须：
  - 开启邮箱确认。
  - 配置精确的 Redirect URL allowlist。
  - 开启 HTTPS 与安全响应头。
  - 将 `SUPABASE_SERVICE_ROLE_KEY` 限制在服务端环境。
